-- Point club-crest collectibles at real crest images (Wikimedia), matched by
-- name. Only CREST collectibles are touched.
UPDATE public.collectibles AS c
SET image_url = v.url
FROM (VALUES
  ('Club América',          'https://upload.wikimedia.org/wikipedia/commons/8/8d/Club_America_Logo.svg'),
  ('Chivas de Guadalajara', 'https://upload.wikimedia.org/wikipedia/en/7/7f/Chivas_de_Guadalajara_logo.svg'),
  ('Cruz Azul',             'https://upload.wikimedia.org/wikipedia/commons/5/58/Cruz_Azul_logo.svg'),
  ('Boca Juniors',          'https://upload.wikimedia.org/wikipedia/commons/4/41/CABJ_Logo.svg'),
  ('River Plate',           'https://upload.wikimedia.org/wikipedia/commons/a/ac/Escudo_del_C_A_River_Plate.svg'),
  ('Flamengo',              'https://upload.wikimedia.org/wikipedia/commons/9/93/Flamengo-RJ_%28BRA%29.png'),
  ('Palmeiras',             'https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg'),
  ('Corinthians',           'https://upload.wikimedia.org/wikipedia/en/5/5a/Corinthians_oficial_logo.svg'),
  ('Bayern Múnich',         'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg'),
  ('Borussia Dortmund',     'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg'),
  ('Paris Saint-Germain',   'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg'),
  ('Juventus',              'https://upload.wikimedia.org/wikipedia/commons/a/a8/Juventus_FC_-_pictogram_black_%28Italy%2C_2017%29.svg'),
  ('Inter de Milán',        'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg'),
  ('AC Milan',              'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg'),
  ('Real Madrid',           'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg'),
  ('FC Barcelona',          'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg'),
  ('Atlético de Madrid',    'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg'),
  ('Manchester City',       'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'),
  ('Liverpool',             'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg'),
  ('Manchester United',     'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg'),
  ('Arsenal',               'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg'),
  ('Chelsea',               'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg'),
  ('Santos FC',             'https://upload.wikimedia.org/wikipedia/commons/3/35/Santos_logo.svg'),
  ('AFC Ajax',              'https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg')
) AS v(name, url)
WHERE c.kind = 'CREST' AND c.name = v.name;
