/* moto-moto — каталог і бренди.
   Адмінка пише свою копію в localStorage['mm_bikes'].
   Кнопка «Експорт JSON» в адмінці віддає масив, який можна вставити сюди замість DEFAULT_BIKES. */

const BRANDS = [
  { id: 'ducati',          name: 'Ducati',          country: 'IT', type: 'ice' },
  { id: 'harley-davidson', name: 'Harley-Davidson', country: 'US', type: 'ice' },
  { id: 'bmw',             name: 'BMW',             country: 'DE', type: 'ice' },
  { id: 'kawasaki',        name: 'Kawasaki',        country: 'JP', type: 'ice' },
  { id: 'yamaha',          name: 'Yamaha',          country: 'JP', type: 'ice' },
  { id: 'suzuki',          name: 'Suzuki',          country: 'JP', type: 'ice' },
  { id: 'honda',           name: 'Honda',           country: 'JP', type: 'ice' },
  { id: 'damon',           name: 'Damon',           country: 'CA', type: 'electric' },
  { id: 'energica',        name: 'Energica',        country: 'IT', type: 'electric' },
  { id: 'livewire',        name: 'LiveWire',        country: 'US', type: 'electric' },
  { id: 'zero',            name: 'Zero',            country: 'US', type: 'electric' }
];

const DEFAULT_BIKES = [
  {
    id: 'ducati-panigale-v4s', n: '01',
    brand: 'Ducati', brandId: 'ducati', model: 'Panigale V4 S',
    year: 2024, price: 32000,
    power: 209, displacement: 1103, type: 'ice', category: 'Суперспорт',
    desc: 'Заводський трековий болід із номерами. Підвіска Öhlins Smart EC 2.0 і 209 сил, які не пробачають неуважності.',
    photo: 'assets/bikes/01-ducati-panigale-v4s/main.jpg',
    credit: { author: 'TaurusEmerald', license: 'CC BY-SA 4.0', source: 'Wikimedia Commons' },
    gallery: []
  },
  {
    id: 'harley-cvo-road-glide', n: '02',
    brand: 'Harley-Davidson', brandId: 'harley-davidson', model: 'CVO Road Glide',
    year: 2024, price: 45000,
    power: 115, displacement: 1977, type: 'ice', category: 'Турер',
    desc: 'Найдорожча серія Harley. Milwaukee-Eight 121 і 12-дюймовий екран — на трасі це диван, який їде.',
    photo: 'assets/bikes/02-harley-davidson-cvo-road-glide/main.jpg',
    credit: { author: 'Lightburst', license: 'CC BY-SA 4.0', source: 'Wikimedia Commons' },
    gallery: []
  },
  {
    id: 'bmw-r1300gs', n: '03',
    brand: 'BMW', brandId: 'bmw', model: 'R 1300 GS',
    year: 2024, price: 21000,
    power: 145, displacement: 1300, type: 'ice', category: 'Адвенчер',
    desc: 'Новий боксер, легший за попередника на 12 кг. Той самий мотоцикл, яким їдуть з Мюнхена до Монголії.',
    photo: 'assets/bikes/03-bmw-r1300gs/main.jpg',
    credit: { author: 'Cjp24', license: 'CC BY-SA 4.0', source: 'Wikimedia Commons' },
    gallery: []
  },
  {
    id: 'kawasaki-zx10r', n: '04',
    brand: 'Kawasaki', brandId: 'kawasaki', model: 'Ninja ZX-10R',
    year: 2024, price: 18000,
    power: 203, displacement: 998, type: 'ice', category: 'Суперспорт',
    desc: 'Шість титулів WSBK у родоводі. Купують для треку, живе на дорозі.',
    photo: 'assets/bikes/04-kawasaki-ninja-zx10r/main.jpg',
    credit: { author: 'Tokumeigakarinoaoshima', license: 'CC BY-SA 4.0', source: 'Wikimedia Commons' },
    gallery: []
  },
  {
    id: 'yamaha-r1', n: '05',
    brand: 'Yamaha', brandId: 'yamaha', model: 'YZF-R1',
    year: 2024, price: 19000,
    power: 197, displacement: 998, type: 'ice', category: 'Суперспорт',
    desc: 'Мотор crossplane звучить як MotoGP, бо звідти й прийшов. У США — версія без європейських обмежень.',
    photo: 'assets/bikes/05-yamaha-yzf-r1/main.jpg',
    credit: { author: 'Rainmaker47', license: 'CC BY-SA 4.0', source: 'Wikimedia Commons' },
    gallery: []
  },
  {
    id: 'suzuki-hayabusa', n: '06',
    brand: 'Suzuki', brandId: 'suzuki', model: 'Hayabusa',
    year: 2024, price: 19000,
    power: 188, displacement: 1340, type: 'ice', category: 'Спорт-турер',
    desc: 'Легенда 300 км/год у третьому поколінні. Гальма Brembo Stylema і та сама аеродинаміка-крапля.',
    photo: 'assets/bikes/06-suzuki-hayabusa/main.jpg',
    credit: { author: 'AVMOTO', license: 'CC BY-SA 4.0', source: 'Wikimedia Commons' },
    gallery: []
  },
  {
    id: 'honda-africa-twin', n: '07',
    brand: 'Honda', brandId: 'honda', model: 'Africa Twin Adventure Sports ES',
    year: 2024, price: 18000,
    power: 101, displacement: 1084, type: 'ice', category: 'Адвенчер',
    desc: 'Коробка DCT, електронна підвіска Showa, бак на 24,8 л. Їде туди, де асфальт закінчився два дні тому.',
    photo: 'assets/bikes/07-honda-africa-twin-adventure-sports/main.jpg',
    credit: { author: 'Mr.choppers', license: 'CC BY-SA 4.0', source: 'Wikimedia Commons' },
    gallery: []
  },
  {
    id: 'energica-ego', n: '08',
    brand: 'Energica', brandId: 'energica', model: 'Ego',
    year: 2024, price: 26000,
    power: 145, displacement: null, type: 'electric', category: 'Електро-суперспорт',
    desc: 'Італійський електросуперспорт із Модени. 145 сил, 200 Нм із нуля обертів і гальма Brembo.',
    photo: 'assets/bikes/08-energica-ego/main.jpg',
    credit: { author: 'Jan Ainali', license: 'CC BY-SA 4.0', source: 'Wikimedia Commons' },
    gallery: []
  },
  {
    id: 'zero-dsrx', n: '09',
    brand: 'Zero', brandId: 'zero', model: 'DSR/X',
    year: 2024, price: 24000,
    power: 100, displacement: null, type: 'electric', category: 'Електро-адвенчер',
    desc: 'Каліфорнійський електроадвенчер: 225 Нм, до 290 км міського запасу, жодного сервісу двигуна.',
    photo: 'assets/bikes/09-zero-dsrx/main.jpg',
    credit: { author: 'Matti Blume', license: 'CC BY-SA 4.0', source: 'Wikimedia Commons' },
    gallery: []
  },
  {
    id: 'livewire-one', n: '10',
    brand: 'LiveWire', brandId: 'livewire', model: 'One',
    year: 2024, price: 22000,
    power: 105, displacement: null, type: 'electric', category: 'Електро-нейкед',
    desc: 'Електричний підрозділ Harley-Davidson. 0–100 за 3 секунди, повна зарядка від DC за годину.',
    photo: 'assets/bikes/10-livewire-one/main.jpg',
    credit: { author: 'big-ashb', license: 'CC BY 2.0', source: 'Wikimedia Commons' },
    gallery: []
  }
];

const PROCESS = [
  { n: '01', title: 'Підбір',      text: 'Ви називаєте модель і бюджет. Ми шукаємо на аукціонах Copart, IAAI та в дилерів США.' },
  { n: '02', title: 'Перевірка',   text: 'Звіт Carfax, фото зі стоянки, огляд нашою людиною на місці. До оплати.' },
  { n: '03', title: 'Викуп',       text: 'Купуємо на своє ім’я. Ви бачите інвойс аукціону без націнки.' },
  { n: '04', title: 'Логістика',   text: 'Наземна доставка до порту, консолідація в контейнер, морем до Європи.' },
  { n: '05', title: 'Розмитнення', text: 'Брокер закриває митницю. Усі платежі показуємо в кошторисі наперед.' },
  { n: '06', title: 'Передача',    text: 'Постановка на облік і ключі. Середній строк — 45–60 днів від торгів.' }
];
