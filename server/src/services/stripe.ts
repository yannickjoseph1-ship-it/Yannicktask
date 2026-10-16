import Stripe from 'stripe';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { badRequest, paymentRequired } from '../lib/errors.js';
import type { SubscriptionStatus, SubscriptionTier } from '../generated/prisma/enums.js';

/**
 * Abonnement magasin via Stripe Checkout (mode subscription).
 * Deux prix récurrents mensuels : STANDARD et PREMIUM (ids dans l'env).
 * Les webhooks maintiennent Shop.subscriptionTier / subscriptionStatus.
 */

export const stripe = config.stripe.enabled ? new Stripe(config.stripe.secretKey) : null;

export type PaidTier = Exclude<SubscriptionTier, 'NONE'>;

function priceIdFor(tier: PaidTier): string {
  const id = config.stripe.prices[tier];
  if (!id) throw badRequest(`Prix Stripe non configuré pour le tier ${tier}`);
  return id;
}

function tierFromPrice(priceId: string | undefined): PaidTier | null {
  if (!priceId) return null;
  if (priceId === config.stripe.prices.PREMIUM) return 'PREMIUM';
  if (priceId === config.stripe.prices.STANDARD) return 'STANDARD';
  return null;
}

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'ACTIVE';
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
      return 'PAST_DUE';
    default:
      return 'CANCELED';
  }
}

export async function ensureCustomer(shopId: string): Promise<string> {
  if (!stripe) throw paymentRequired('Stripe non configuré');
  const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId }, include: { user: true } });
  if (shop.stripeCustomerId) return shop.stripeCustomerId;
  const customer = await stripe.customers.create({
    email: shop.user.email,
    name: shop.name,
    metadata: { shopId },
  });
  await prisma.shop.update({ where: { id: shopId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createCheckoutSession(shopId: string, tier: PaidTier): Promise<{ url: string }> {
  if (!stripe) throw paymentRequired('Stripe non configuré');
  const customer = await ensureCustomer(shopId);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    line_items: [{ price: priceIdFor(tier), quantity: 1 }],
    success_url: `${config.clientUrl}/shop?checkout=success`,
    cancel_url: `${config.clientUrl}/shop?checkout=cancel`,
    subscription_data: { metadata: { shopId, tier } },
    metadata: { shopId, tier },
  });
  if (!session.url) throw new Error('Stripe n\'a pas renvoyé d\'URL de paiement');
  return { url: session.url };
}

export async function createPortalSession(shopId: string): Promise<{ url: string }> {
  if (!stripe) throw paymentRequired('Stripe non configuré');
  const customer = await ensureCustomer(shopId);
  const session = await stripe.billingPortal.sessions.create({
    customer,
    return_url: `${config.clientUrl}/shop`,
  });
  return { url: session.url };
}

/** Applique l'état d'une souscription Stripe au magasin. */
export async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const shopId = sub.metadata?.shopId;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const shop = shopId
    ? await prisma.shop.findUnique({ where: { id: shopId } })
    : await prisma.shop.findUnique({ where: { stripeCustomerId: customerId } });
  if (!shop) {
    console.warn(`[stripe] souscription ${sub.id} sans magasin associé`);
    return;
  }
  const item = sub.items.data[0];
  const tier = tierFromPrice(item?.price?.id) ?? (sub.metadata?.tier as PaidTier | undefined) ?? 'STANDARD';
  const status = mapStatus(sub.status);
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null;
  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: status,
      subscriptionTier: status === 'CANCELED' ? 'NONE' : tier,
      currentPeriodEnd: periodEnd,
    },
  });
}

export async function handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<{ received: true; type: string }> {
  if (!stripe) throw paymentRequired('Stripe non configuré');
  if (!config.stripe.webhookSecret || !signature) throw badRequest('Signature webhook manquante');
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  } catch (e) {
    throw badRequest(`Signature webhook invalide : ${(e as Error).message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.mode === 'subscription' && session.subscription) {
        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscription(sub);
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await syncSubscription(event.data.object);
      break;
    case 'invoice.payment_failed': {
      const customerId = typeof event.data.object.customer === 'string' ? event.data.object.customer : event.data.object.customer?.id;
      if (customerId) {
        await prisma.shop.updateMany({ where: { stripeCustomerId: customerId }, data: { subscriptionStatus: 'PAST_DUE' } });
      }
      break;
    }
    default:
      break;
  }
  return { received: true, type: event.type };
}

/** Mode développement sans Stripe : active/désactive un abonnement manuellement. */
export async function devSetSubscription(shopId: string, tier: SubscriptionTier): Promise<void> {
  if (config.isProd) throw badRequest('Indisponible en production');
  await prisma.shop.update({
    where: { id: shopId },
    data: {
      subscriptionTier: tier,
      subscriptionStatus: tier === 'NONE' ? 'CANCELED' : 'ACTIVE',
      currentPeriodEnd: tier === 'NONE' ? null : new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });
}
