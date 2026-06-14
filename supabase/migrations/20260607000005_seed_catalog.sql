-- Seed leagues + collectibles (escudos / avatares / estadios).
-- Idempotent: re-running leaves existing rows untouched.

INSERT INTO "leagues" ("id","code","name","country","country_code","image_url","tier","min_market_value","max_market_value") VALUES
  ('pe','pe','Liga 1',           'Perú',       'pe','/leagues/pe.png',1,0,  19),
  ('ar','ar','Liga Profesional', 'Argentina',  'ar','/leagues/ar.png',2,20, 44),
  ('br','br','Brasileirão',      'Brasil',     'br','/leagues/br.png',3,45, 79),
  ('fr','fr','Ligue 1',          'Francia',    'fr','/leagues/fr.png',4,80, 129),
  ('it','it','Serie A',          'Italia',     'it','/leagues/it.png',5,130,189),
  ('de','de','Bundesliga',       'Alemania',   'de','/leagues/de.png',6,190,259),
  ('es','es','LaLiga',           'España',     'es','/leagues/es.png',7,260,349),
  ('en','en','Premier League',   'Inglaterra', 'gb','/leagues/en.png',8,350,NULL)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "collectibles"
  ("id","kind","name","description","art_key","image_url","gradient_from","gradient_to","rarity","price","is_starter","sort_order","league_id") VALUES
  -- Liga 1 (Perú) — free starter picks (also offered during first-login setup)
  ('pe-crest-clasico',  'CREST',  'CLÁSICO',         'Escudo heráldico tradicional.',                          'clasico',  NULL,NULL,NULL,'COMMON',0,true,0,'pe'),
  ('pe-crest-circulo',  'CREST',  'CIRCULAR',        'Insignia redonda de inspiración moderna.',               'circulo',  NULL,NULL,NULL,'COMMON',0,true,1,'pe'),
  ('pe-crest-angular',  'CREST',  'ANGULAR',         'Geometría audaz para un club ambicioso.',                'angular',  NULL,NULL,NULL,'COMMON',0,true,2,'pe'),
  ('pe-avatar-veteran', 'AVATAR', 'EL VETERANO',     'Décadas de experiencia. Autoridad en el vestuario.',     'veteran',  NULL,NULL,NULL,'COMMON',0,true,0,'pe'),
  ('pe-avatar-modern',  'AVATAR', 'EL MODERNO',      'Datos, tecnología y visión de futuro.',                  'modern',   NULL,NULL,NULL,'COMMON',0,true,1,'pe'),
  ('pe-avatar-visionary','AVATAR','LA VISIONARIA',   'Liderazgo que rompe esquemas. Resultados que callan bocas.','visionary',NULL,NULL,NULL,'COMMON',0,true,2,'pe'),
  ('pe-stadium-coliseo','STADIUM','COLISEO NACIONAL','Clásico e histórico. Cuna de grandes glorias.',          'coliseo',  NULL,NULL,NULL,'COMMON',0,true,0,'pe'),
  ('pe-stadium-arena',  'STADIUM','ARENA FUTURO',    'Moderno, tecnológico. El estadio del mañana.',           'arena',    NULL,NULL,NULL,'COMMON',0,true,1,'pe'),
  ('pe-stadium-fortaleza','STADIUM','LA FORTALEZA',  'Compacto e intimidante. Local infranqueable.',           'fortaleza',NULL,NULL,NULL,'COMMON',0,true,2,'pe'),
  -- Mercado catalogue — escudos de clubes
  ('pe-crest-universitario','CREST','Universitario', 'Escudo de Universitario de Deportes · Liga 1.',          'crest-uni',NULL,NULL,NULL,'EPIC',  12000,false,3,'pe'),
  ('ar-crest-colo-colo','CREST',  'Colo-Colo',       'Escudo del Cacique · cono sur.',                         'crest-col',NULL,NULL,NULL,'RARE',   8000,false,0,'ar'),
  ('br-crest-fluminense','CREST', 'Fluminense',      'Escudo del Flu · Brasileirão.',                          'crest-flu',NULL,NULL,NULL,'RARE',   9500,false,0,'br'),
  ('br-crest-nacional', 'CREST',  'Nacional',        'Escudo del Bolso · Primera de Uruguay.',                 'crest-nac',NULL,NULL,NULL,'RARE',   7500,false,1,'br'),
  ('fr-crest-olympique','CREST',  'Olympique',       'Escudo provenzal · Ligue 1.',                            'crest-nac',NULL,NULL,NULL,'EPIC',  18000,false,0,'fr'),
  ('it-crest-juventus', 'CREST',  'Juventus',        'Escudo de la Vecchia Signora · Serie A.',                'crest-col',NULL,NULL,NULL,'LEGEND',28000,false,0,'it'),
  ('es-crest-real-madrid','CREST','Real Madrid',     'Escudo merengue · LaLiga.',                              'crest-rma',NULL,NULL,NULL,'LEGEND',25000,false,0,'es'),
  -- Avatares (caricaturas)
  ('ar-avatar-crack-10','AVATAR', 'Crack 10',        'Avatar caricatura del eterno número 10.',                NULL,'/assets/messi-avatar.png',NULL,NULL,'EPIC',  14000,false,0,'ar'),
  ('br-avatar-el-comandante','AVATAR','El Comandante','Avatar caricatura de líder nato.',                      NULL,'/assets/messi-avatar.png',NULL,NULL,'EPIC',  14000,false,0,'br'),
  ('de-avatar-el-kaiser','AVATAR','El Káiser',        'Avatar caricatura imperial.',                           NULL,'/assets/messi-avatar.png',NULL,NULL,'EPIC',  20000,false,0,'de'),
  ('es-avatar-la-pulga','AVATAR', 'La Pulga',        'Avatar caricatura legendario.',                          NULL,'/assets/messi-avatar.png',NULL,NULL,'LEGEND',30000,false,0,'es'),
  ('en-avatar-the-special','AVATAR','The Special',   'Avatar caricatura del míster especial.',                 NULL,'/assets/messi-avatar.png',NULL,NULL,'LEGEND',32000,false,0,'en'),
  -- Estadios
  ('ar-stadium-bombonera','STADIUM','La Bombonera',  'El templo de La Boca · Buenos Aires.',                   NULL,'/assets/bombonera.jpg',NULL,NULL,'LEGEND',40000,false,0,'ar'),
  ('fr-stadium-velodrome','STADIUM','Vélodrome',     'Caldera marsellesa · Francia.',                          NULL,NULL,'#2a6f9f','#123649','EPIC',  26000,false,0,'fr'),
  ('br-stadium-maracana','STADIUM','Maracanã',       'El coloso de Río · Brasil.',                             NULL,NULL,'#9c2a3a','#4a1219','EPIC',  22000,false,0,'br'),
  ('it-stadium-san-siro','STADIUM','San Siro',       'La Scala del fútbol · Milán.',                           NULL,NULL,'#2a4f8f','#15294a','EPIC',  30000,false,0,'it'),
  ('es-stadium-bernabeu','STADIUM','Bernabéu',       'El estadio blanco · Madrid.',                            NULL,NULL,'#6a5a2a','#2e2710','LEGEND',45000,false,0,'es'),
  ('en-stadium-old-trafford','STADIUM','Old Trafford','El Teatro de los Sueños · Mánchester.',                 NULL,NULL,'#7a1f2a','#3a0f15','LEGEND',48000,false,0,'en')
ON CONFLICT ("id") DO NOTHING;
