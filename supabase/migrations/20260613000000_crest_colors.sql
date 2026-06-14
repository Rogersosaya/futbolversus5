-- Add a `colors` column to collectibles holding the 1–2 most representative
-- club colors (hex strings) for CREST collectibles. Used to theme each club's
-- card / page in the UI.
--
-- text[] keeps it flexible while a CHECK enforces the "max 2 colors" rule.
-- Primary color is stored first.

alter table public.collectibles
  add column colors text[] not null default '{}';

alter table public.collectibles
  add constraint collectibles_colors_max_two
  check (coalesce(array_length(colors, 1), 0) <= 2);

-- Representative colors per club (primary first). Only CREST rows get values.
update public.collectibles as c set colors = v.colors
from (values
  ('it-crest-milan',             array['#FB090B', '#000000']),  -- AC Milan: rojo y negro
  ('legends-crest-ajax',         array['#D2122E', '#FFFFFF']),  -- Ajax: rojo y blanco
  ('pe-crest-alianza-lima',      array['#1B2A4A', '#FFFFFF']),  -- Alianza Lima: azul y blanco
  ('en-crest-arsenal',           array['#EF0107', '#FFFFFF']),  -- Arsenal: rojo y blanco
  ('fr-crest-monaco',            array['#CE2939', '#FFFFFF']),  -- Mónaco: rojo y blanco
  ('es-crest-atletico-madrid',   array['#CB3524', '#FFFFFF']),  -- Atlético: rojiblanco
  ('de-crest-bayer-leverkusen',  array['#E32219', '#000000']),  -- Leverkusen: rojo y negro
  ('de-crest-bayern-munich',     array['#DC052D', '#FFFFFF']),  -- Bayern: rojo y blanco
  ('ar-crest-boca-juniors',      array['#002F6C', '#FCD116']),  -- Boca: azul y oro
  ('de-crest-borussia-dortmund', array['#FDE100', '#000000']),  -- Dortmund: amarillo y negro
  ('en-crest-chelsea',           array['#034694', '#FFFFFF']),  -- Chelsea: azul real
  ('mx-crest-guadalajara',       array['#C8102E', '#FFFFFF']),  -- Chivas: rojo y blanco
  ('mx-crest-america',           array['#FFE600', '#002F87']),  -- América: amarillo y azul
  ('br-crest-corinthians',       array['#000000', '#FFFFFF']),  -- Corinthians: negro y blanco
  ('mx-crest-cruz-azul',         array['#003DA5', '#FFFFFF']),  -- Cruz Azul: azul y blanco
  ('es-crest-barcelona',         array['#004D98', '#A50044']),  -- Barça: azulgrana
  ('br-crest-flamengo',          array['#E30613', '#000000']),  -- Flamengo: rojo y negro
  ('ar-crest-independiente',     array['#E2231A', '#FFFFFF']),  -- Independiente: rojo
  ('it-crest-inter',             array['#010E80', '#000000']),  -- Inter: azul y negro
  ('it-crest-juventus',          array['#000000', '#FFFFFF']),  -- Juventus: negro y blanco
  ('en-crest-liverpool',         array['#C8102E', '#FFFFFF']),  -- Liverpool: rojo
  ('en-crest-manchester-city',   array['#6CABDD', '#FFFFFF']),  -- Man City: celeste
  ('en-crest-manchester-united', array['#DA291C', '#FFFFFF']),  -- Man United: rojo
  ('it-crest-napoli',            array['#12A0D7', '#FFFFFF']),  -- Napoli: azzurro
  ('legends-crest-cosmos',       array['#00843D', '#002D62']),  -- Cosmos: verde y azul
  ('fr-crest-lyon',              array['#14387F', '#DA001C']),  -- Lyon: azul y rojo
  ('fr-crest-marseille',         array['#2FAEE0', '#FFFFFF']),  -- Marsella: celeste y blanco
  ('br-crest-palmeiras',         array['#006437', '#FFFFFF']),  -- Palmeiras: verde y blanco
  ('fr-crest-psg',               array['#001E62', '#E30613']),  -- PSG: azul marino y rojo
  ('ar-crest-racing',            array['#6CACE4', '#FFFFFF']),  -- Racing: celeste y blanco
  ('de-crest-rb-leipzig',        array['#DD0741', '#FFFFFF']),  -- Leipzig: rojo y blanco
  ('es-crest-real-madrid',       array['#FFFFFF']),             -- Real Madrid: blanco
  ('ar-crest-river-plate',       array['#FFFFFF', '#D81E05']),  -- River: blanco y rojo
  ('legends-crest-santos',       array['#000000', '#FFFFFF']),  -- Santos: negro y blanco
  ('br-crest-sao-paulo',         array['#FE0000', '#000000']),  -- São Paulo: rojo y negro
  ('es-crest-sevilla',           array['#FFFFFF', '#D81E05']),  -- Sevilla: blanco y rojo
  ('pe-crest-sporting-cristal',  array['#00A1E0', '#FFFFFF']),  -- Sporting Cristal: celeste y blanco
  ('mx-crest-tigres',            array['#FFC72C', '#00529B']),  -- Tigres: amarillo y azul
  ('pe-crest-universitario',     array['#F4E7C5', '#7A0019'])   -- Universitario: crema y granate
) as v(id, colors)
where c.id = v.id and c.kind = 'CREST';
