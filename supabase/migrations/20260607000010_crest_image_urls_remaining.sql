-- Real crest images (Wikimedia, SVG/HD) for the remaining club crests, matched
-- by name. Only CREST collectibles are touched.
UPDATE public.collectibles AS c
SET image_url = v.url
FROM (VALUES
  ('Alianza Lima',          'https://upload.wikimedia.org/wikipedia/commons/c/c5/Escudo_Alianza_Lima.svg'),
  ('Universitario',         'https://upload.wikimedia.org/wikipedia/commons/7/77/Logo_oficial_de_Universitario.svg'),
  ('Sporting Cristal',      'https://upload.wikimedia.org/wikipedia/commons/5/59/Escudo_de_Sporting_Cristal_2025.svg'),
  ('Tigres UANL',           'https://upload.wikimedia.org/wikipedia/en/8/82/Tigres_UANL_logo_%28crest%29.svg'),
  ('Racing Club',           'https://upload.wikimedia.org/wikipedia/commons/5/56/Escudo_de_Racing_Club_%282014%29.svg'),
  ('Independiente',         'https://upload.wikimedia.org/wikipedia/commons/d/db/Escudo_del_Club_Atl%C3%A9tico_Independiente.svg'),
  ('São Paulo',             'https://upload.wikimedia.org/wikipedia/commons/f/f4/S%C3%A3o_Paulo_Futebol_Clube_logo_%282022%29.svg'),
  ('RB Leipzig',            'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg'),
  ('Bayer Leverkusen',      'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg'),
  ('Olympique de Marsella', 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Olympique_de_Marseille_2026_logo.svg'),
  ('Olympique de Lyon',     'https://upload.wikimedia.org/wikipedia/en/1/1c/Olympique_Lyonnais_logo.svg'),
  ('AS Mónaco',             'https://upload.wikimedia.org/wikipedia/en/c/cf/LogoASMonacoFC2021.svg'),
  ('Napoli',                'https://upload.wikimedia.org/wikipedia/commons/4/4d/SSC_Napoli_2025_%28white_and_azure%29.svg'),
  ('Sevilla FC',            'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg'),
  ('New York Cosmos',       'https://upload.wikimedia.org/wikipedia/en/8/85/New_York_Cosmos_2010.svg')
) AS v(name, url)
WHERE c.kind = 'CREST' AND c.name = v.name;
