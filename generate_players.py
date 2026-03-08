import csv
import json

rows = []
with open('players_extracted.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    for row in reader:
        if len(row) >= 20 and row[0] and not row[0].startswith('List'):
            try:
                sr = int(row[0])
                rows.append(row)
            except:
                pass

players = []
for row in rows:
    firstName = row[3].strip()
    surname = row[4].strip()
    country = row[5].strip() or 'India'
    age = row[8].strip()
    specialism = row[9].strip()
    battingStyle = row[10].strip()
    bowlingStyle = row[11].strip() if len(row) > 11 else ''
    testCaps = row[12].strip() if len(row) > 12 else ''
    odiCaps = row[13].strip() if len(row) > 13 else ''
    t20Caps = row[14].strip() if len(row) > 14 else ''
    iplCaps = row[15].strip() if len(row) > 15 else ''
    team2025 = row[16].strip() if len(row) > 16 else ''
    cappedStatus = row[18].strip() if len(row) > 18 else ''
    basePrice = row[19].strip() if len(row) > 19 else '30'
    setCode = row[2].strip() if len(row) > 2 else ''

    name = f'{firstName} {surname}'

    p = {
        'id': int(row[0]),
        'name': name,
        'firstName': firstName,
        'surname': surname,
        'country': country,
        'age': int(age) if age else 0,
        'specialism': specialism,
        'battingStyle': battingStyle,
        'bowlingStyle': bowlingStyle,
        'testCaps': int(testCaps) if testCaps else 0,
        'odiCaps': int(odiCaps) if odiCaps else 0,
        't20Caps': int(t20Caps) if t20Caps else 0,
        'iplCaps': int(iplCaps) if iplCaps else 0,
        'team2025': team2025,
        'cappedStatus': cappedStatus,
        'basePrice': int(basePrice) if basePrice else 30,
        'setCode': setCode,
    }
    players.append(p)

lines = []
lines.append('// Auto-generated from TATA IPL 2026 Auction List PDF')
lines.append('// All 350 players with real stats')
lines.append('')
lines.append('const allPlayers = ' + json.dumps(players, indent=2) + ';')
lines.append('')
lines.append('export function getAllPlayers() {')
lines.append('  return allPlayers;')
lines.append('}')
lines.append('')
lines.append('export function getPlayersByCategory() {')
lines.append('  return {')
lines.append('    BATTER: allPlayers.filter(p => p.specialism === "BATTER"),')
lines.append('    BOWLER: allPlayers.filter(p => p.specialism === "BOWLER"),')
lines.append('    "ALL-ROUNDER": allPlayers.filter(p => p.specialism === "ALL-ROUNDER"),')
lines.append('    WICKETKEEPER: allPlayers.filter(p => p.specialism === "WICKETKEEPER"),')
lines.append('  };')
lines.append('}')

with open('server/data/players.js', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f'Generated players.js with {len(players)} players')
cats = {}
for p in players:
    cats[p['specialism']] = cats.get(p['specialism'], 0) + 1
for k, v in cats.items():
    print(f'  {k}: {v}')
