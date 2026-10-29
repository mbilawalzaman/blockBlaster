"""Generate original offline PCM effects using only Python's standard library."""
import math
import struct
import wave
from pathlib import Path

RATE = 22050
OUT = Path(__file__).resolve().parents[1] / 'assets' / 'sounds'
OUT.mkdir(parents=True, exist_ok=True)
for name, notes, duration in [
    ('place', [440, 660], 0.10),
    ('clear', [523.25, 659.25, 783.99], 0.32),
    ('combo', [659.25, 783.99, 987.77, 1318.51], 0.48),
]:
    samples = []
    for i in range(int(RATE * duration)):
        t = i / RATE
        value = 0.0
        for j, frequency in enumerate(notes):
            local = t - j * duration / (len(notes) * 2)
            if local >= 0:
                envelope = min(local / 0.008, 1) * math.exp(-local * 12)
                value += math.sin(2 * math.pi * frequency * local) * envelope / len(notes)
        value *= min((duration - t) / 0.025, 1)
        samples.append(struct.pack('<h', int(max(-1, min(1, value * 0.55)) * 32767)))
    with wave.open(str(OUT / (name + '.wav')), 'wb') as output:
        output.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        output.writeframes(b''.join(samples))
