#!/usr/bin/env python3
"""Catalogue OpenAI (flux produits ChatGPT) de Rafai Limousine.

Source des prix : forfaits aéroport publiés sur le site (9 nov. 2026), prix fixes TTC
Paris <-> CDG, Orly ou Le Bourget : Classe E 170 €, Classe V 200 €, Classe S 265 €, Range Rover 350 €.
Capacités : page Flotte du site. Promesses : uniquement celles déjà publiques.
Spécification : https://developers.openai.com/commerce/specs/feed (version stable).
Sortie : rafai-limousine-feed.jsonl et rafai-limousine-feed.csv
"""
import csv, io, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
IMG_SHA = 'a7cc4c7ce68332fbe2571f2f04ad8c2bf86d6ecc'
IMG = 'https://cdn.jsdelivr.net/gh/rafailimousine-gif/rafai-ios@%s/web/openai-feed/img/' % IMG_SHA
SITE = 'https://www.rafai-limousine.com'
PAGE = SITE + '/services/airport-transfers'

AIRPORTS = [
    ('CDG', 'Paris Charles de Gaulle Airport (CDG)'),
    ('ORY', 'Paris Orly Airport (ORY)'),
    ('LBG', 'Paris Le Bourget Airport (LBG)'),
]
VEHICLES = [
    ('E', 'Mercedes E-Class', 'Business sedan', 170, 3, 2, 'mercedes-e-class.jpg',
     'Comfortable and quiet business sedan with leather seats, panoramic roof and ambient lighting.'),
    ('V', 'Mercedes V-Class', 'Business van', 200, 7, 7, 'mercedes-v-class.jpg',
     'Spacious van with face-to-face leather lounge seating, for families, groups and plenty of luggage.'),
    ('S', 'Mercedes S-Class', 'First class sedan', 265, 3, 2, 'mercedes-s-class.jpg',
     'Our flagship sedan for VIP guests, weddings and special occasions.'),
    ('RR', 'Range Rover Vogue Autobiography', 'Luxury SUV', 350, 3, 3, 'range-rover-vogue-autobiography.jpg',
     'Luxury SUV for long-distance trips, day tours and arriving in style.'),
]
INCLUDED = ('Fixed price, VAT included, confirmed before booking. Real-time flight tracking, '
            'meet and greet with a name sign, and 1 hour of free waiting at the airport. '
            'Professional licensed chauffeur (VTC licence EVTC092230979). Available 24/7.')


def rows():
    for code, airport in AIRPORTS:
        for direction in ('from', 'to'):
            a, b = (airport, 'Paris') if direction == 'from' else ('Paris', airport)
            group = 'RL-AT-%s-%s' % (code, 'PAR' if direction == 'from' else 'IN')
            group = 'RL-AT-%s-PARIS' % code if direction == 'from' else 'RL-AT-PARIS-%s' % code
            for vc, vname, vtype, price, pax, bags, img, vdesc in VEHICLES:
                item_id = '%s-%s' % (group, vc)
                yield {
                    'item_id': item_id,
                    'offer_id': item_id + '-OFFER',
                    'group_id': group,
                    'listing_has_variations': True,
                    'variant_dict': {'vehicle': vname},
                    'title': 'Private chauffeur transfer %s to %s, %s' % (a, b, vname),
                    'description': ('Private airport transfer with a chauffeur in Paris, from %s to %s, in a %s (%s). '
                                    '%s Up to %d passengers and %d bags. %s Booking is completed on rafai-limousine.com.'
                                    % (a, b, vname, vtype.lower(), vdesc, pax, bags, INCLUDED)),
                    'url': PAGE,
                    'brand': 'Rafai Limousine',
                    'seller_name': 'Rafai Limousine',
                    'seller_url': SITE,
                    'image_url': IMG + img,
                    'availability': 'in_stock',
                    'price': '%.2f EUR' % price,
                    'product_category': 'Travel > Ground Transportation > Airport Transfers',
                    'target_countries': ['US'],
                    'store_country': 'FR',
                    'is_eligible_search': True,
                    'is_eligible_checkout': False,
                    'return_policy': SITE + '/cgv',
                    'seller_tos': SITE + '/cgv',
                    'seller_privacy_policy': SITE + '/confidentialite',
                }


def main():
    data = list(rows())
    ids = [r['item_id'] for r in data]
    assert len(ids) == len(set(ids)) == 24
    for r in data:
        assert len(r['title']) <= 150, r['title']
        assert r['group_id'] != r['item_id']
    with io.open(os.path.join(HERE, 'rafai-limousine-feed.jsonl'), 'w', encoding='utf-8') as f:
        for r in data:
            f.write(json.dumps(r, ensure_ascii=False) + '\n')
    cols = list(data[0].keys())
    with io.open(os.path.join(HERE, 'rafai-limousine-feed.csv'), 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(cols)
        for r in data:
            w.writerow([json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else
                        ('true' if v is True else 'false' if v is False else v) for v in (r[c] for c in cols)])
    print(len(data), 'lignes')


if __name__ == '__main__':
    main()
