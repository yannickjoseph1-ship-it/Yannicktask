"""Synthèse des effets sonores de Politics qu'on ne trouve pas en CC0.

Chaque son est calculé ici, sans échantillon extérieur : ils sont donc
libres de droits (créés pour le projet). Sortie : WAV 44,1 kHz dans le
dossier passé en argument ; la conversion en .ogg se fait avec ffmpeg.

    python synth_sons.py <dossier_sortie>
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
rng = np.random.default_rng(1983)


def t(dur):
    return np.arange(int(SR * dur)) / SR


def env(n, attaque=0.002, decroissance=0.3):
    x = np.arange(n) / SR
    a = np.clip(x / attaque, 0, 1)
    return a * np.exp(-x / decroissance)


def lowpass(x, fc):
    # filtre passe-bas à un pôle, appliqué deux fois
    a = np.exp(-2 * np.pi * fc / SR)
    for _ in range(2):
        y = np.empty_like(x)
        acc = 0.0
        for i, v in enumerate(x):
            acc = (1 - a) * v + a * acc
            y[i] = acc
        x = y
    return x


def bandpass(x, lo, hi):
    return lowpass(x, hi) - lowpass(x, lo)


def reverb(x, piece=0.25, melange=0.25):
    # réverbération de salle simple : échos décroissants espacés
    out = np.concatenate([x, np.zeros(int(SR * 1.2))])
    for i, d in enumerate([0.029, 0.037, 0.041, 0.053, 0.067, 0.079]):
        k = int(SR * d)
        g = melange * np.exp(-d / piece * 3) * (0.9 ** i)
        out[k:k + len(x)] += g * x
    return out


def normaliser(x, crete_db):
    x = x - np.mean(x)
    return x / (np.max(np.abs(x)) + 1e-9) * 10 ** (crete_db / 20)


def fondu_fin(x, dur=0.05):
    n = min(len(x), int(SR * dur))
    x[-n:] *= np.linspace(1, 0, n)
    return x


def cloche(f0=660, dur=2.8):
    # cloche de séance : partiels inharmoniques d'une petite cloche
    x = t(dur)
    s = np.zeros_like(x)
    for r, g, d in [(0.5, 0.5, 1.6), (1, 1, 1.2), (1.19, 0.6, 0.9), (1.56, 0.4, 0.7),
                    (2, 0.5, 0.6), (2.74, 0.25, 0.4), (3.76, 0.15, 0.3)]:
        s += g * np.sin(2 * np.pi * f0 * r * x) * np.exp(-x / d)
    s *= np.clip(x / 0.001, 0, 1)
    return reverb(s, 0.4, 0.2)


def coup_bois(f=180, dur=0.6, dur_bruit=0.012):
    # coup de maillet sur un bureau : impact bruité + modes du bois
    x = t(dur)
    s = np.zeros_like(x)
    for r, g, d in [(1, 1, 0.06), (2.3, 0.6, 0.035), (3.9, 0.35, 0.02), (6.1, 0.2, 0.012)]:
        s += g * np.sin(2 * np.pi * f * r * x) * np.exp(-x / d)
    n = int(SR * dur_bruit)
    b = rng.standard_normal(n) * np.linspace(1, 0, n)
    s[:n] += 0.8 * lowpass(b, 3000)
    return reverb(s, 0.3, 0.3)


def marteau():
    return coup_bois(170, 0.6)


def tampon():
    # tampon encreur : choc sourd + petit claquement du manche
    s = coup_bois(95, 0.35, 0.02)
    clic = coup_bois(900, 0.08, 0.004) * 0.25
    s[:len(clic)] += clic
    return s


def note(f, dur, timbre="cuivre", vol=1.0):
    x = t(dur)
    if timbre == "cuivre":
        # cuivre synthétique : harmoniques qui s'ouvrent à l'attaque
        s = sum((0.9 ** k) * np.sin(2 * np.pi * f * k * x) * np.clip(x * (8 + 4 * k), 0, 1)
                for k in range(1, 9))
        a = np.clip(x / 0.04, 0, 1) * np.clip((dur - x) / 0.12, 0, 1)
    elif timbre == "synthe":
        # synthé analogique façon générique télé : dents de scie désaccordées
        s = sum((1 / k) * (np.sin(2 * np.pi * f * k * x) + np.sin(2 * np.pi * f * 1.004 * k * x))
                for k in range(1, 12))
        a = np.clip(x / 0.01, 0, 1) * np.exp(-x / (dur * 0.8))
    else:  # cloche douce
        s = np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 2.01 * x)
        a = np.clip(x / 0.003, 0, 1) * np.exp(-x / 0.5)
    return vol * s * a


def melodie(notes, timbre, tempo=0.18):
    # notes : liste de (frequences, duree en pas, debut en pas)
    fin = max(d + o for _, d, o in notes) * tempo + 1.0
    out = np.zeros(int(SR * fin))
    for fs, d, o in notes:
        for f in (fs if isinstance(fs, (list, tuple)) else [fs]):
            n = note(f, d * tempo, timbre, 0.6)
            k = int(SR * o * tempo)
            out[k:k + len(n)] += n
    return out


def hz(nom):
    gamme = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}
    n, alt, octv = nom[0], nom[1:-1], int(nom[-1])
    demi = gamme[n] + (1 if alt == "#" else -1 if alt == "b" else 0) + 12 * (octv - 4)
    return 440 * 2 ** (demi / 12)


def accord(*noms):
    return [hz(n) for n in noms]


def vote_adoptee():
    # fanfare courte, majeur, qui monte
    return reverb(melodie([(hz("C4"), 1, 0), (hz("E4"), 1, 1), (hz("G4"), 1, 2),
                           (accord("C4", "E4", "G4", "C5"), 4, 3)], "cuivre", 0.11), 0.4, 0.25)


def vote_rejetee():
    # deux notes qui descendent, mineur
    return reverb(melodie([(accord("E4", "G4"), 2, 0), (accord("Eb4", "Gb4"), 2, 2),
                           (accord("C4", "Eb4", "G3"), 5, 4)], "cuivre", 0.14), 0.4, 0.25)


def evenement():
    # alerte : deux accords en suspension
    return reverb(melodie([(accord("D4", "A4"), 2, 0), (accord("D4", "G4", "B4"), 5, 2)], "synthe", 0.15), 0.5, 0.3)


def jt_generique():
    # générique de journal télévisé façon début des années 80
    seq = [(hz("A3"), 1, 0), (hz("E4"), 1, 1), (hz("A4"), 1, 2), (hz("C#5"), 2, 3),
           (hz("B4"), 1, 5), (hz("A4"), 1, 6), (accord("A3", "E4", "A4", "C#5", "E5"), 8, 7)]
    s = melodie(seq, "synthe", 0.16)
    basse = melodie([(hz("A2"), 3, 0), (hz("A2"), 4, 3), (hz("A2"), 8, 7)], "synthe", 0.16) * 0.6
    n = min(len(s), len(basse))
    return reverb(s[:n] + basse[:n], 0.5, 0.25)


def election_resultat():
    # roulement de caisse claire puis accord tenu
    roul = np.zeros(int(SR * 1.6))
    for i in range(48):
        k = int(SR * i * 1.5 / 48)
        nb = int(SR * 0.04)
        coup = rng.standard_normal(nb) * np.exp(-np.arange(nb) / SR / 0.012) * (0.3 + 0.7 * i / 48)
        roul[k:k + nb] += coup
    roul = bandpass(roul, 300, 6000)
    acc = melodie([(accord("F3", "C4", "F4", "A4", "C5"), 10, 0)], "cuivre", 0.2)
    out = np.zeros(len(roul) + len(acc))
    out[:len(roul)] += roul * 0.5
    out[int(SR * 1.5):int(SR * 1.5) + len(acc)] += acc
    return reverb(out, 0.5, 0.25)


def applaudissements(dur=6.0, n_mains=40, debut=0.6, fin=1.5):
    # une salle qui applaudit : chaque personne frappe à son rythme,
    # chaque claquement est un bruit filtré différent
    total = int(SR * dur)
    out = np.zeros(total)
    for _ in range(n_mains):
        periode = rng.uniform(0.18, 0.32)
        tc = rng.uniform(0, debut)
        lo, hi = rng.uniform(600, 1200), rng.uniform(2500, 5000)
        nb = int(SR * 0.03)
        modele = bandpass(rng.standard_normal(nb), lo, hi) * np.exp(-np.arange(nb) / SR / 0.006)
        while tc < dur - 0.05:
            k = int(SR * tc)
            g = rng.uniform(0.5, 1.0)
            out[k:k + nb] += g * modele[:len(out[k:k + nb])]
            tc += periode * rng.uniform(0.9, 1.1)
    x = np.arange(total) / SR
    enveloppe = np.clip(x / debut, 0, 1) * np.clip((dur - x) / fin, 0, 1)
    return reverb(out * enveloppe, 0.6, 0.35)


def ecrire(chemin, x):
    x = np.clip(x, -1, 1)
    with wave.open(str(chemin), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


SONS = {
    "effets/conseil_cloche": (cloche, -3),
    "effets/vote_marteau": (marteau, -3),
    "effets/tampon": (tampon, -3),
    "effets/vote_adoptee": (vote_adoptee, -3),
    "effets/vote_rejetee": (vote_rejetee, -3),
    "effets/evenement": (evenement, -3),
    "effets/jt_generique": (jt_generique, -3),
    "effets/election_resultat": (election_resultat, -3),
    "effets/applaudissements_meeting": (applaudissements, -3),
}

if __name__ == "__main__":
    sortie = Path(sys.argv[1])
    for nom, (fn, crete) in SONS.items():
        chemin = sortie / (nom + ".wav")
        chemin.parent.mkdir(parents=True, exist_ok=True)
        ecrire(chemin, fondu_fin(normaliser(fn(), crete)))
        print(nom)
