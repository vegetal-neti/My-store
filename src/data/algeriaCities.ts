export interface Wilaya {
  id: number;
  code: string;
  name: string;
  nameEn: string;
  shippingHome: number;
  shippingPickup: number;
  communes: string[];
}

export const algeriaWilayas: Wilaya[] = [
  {
    id: 1,
    code: "01",
    name: "أدرار",
    nameEn: "Adrar",
    shippingHome: 1000,
    shippingPickup: 650,
    communes: ["أدرار", "فنوغيل", "تمنطيت", "رقان", "أولاد أحمد تيمي", "تسابيت", "زاوية كنتة", "بودا"]
  },
  {
    id: 2,
    code: "02",
    name: "الشلف",
    nameEn: "Chlef",
    shippingHome: 700,
    shippingPickup: 450,
    communes: ["الشلف", "أولاد فارس", "سنجاس", "الشطية", "تنس", "بوقادير", "تاجموت", "وادي الفضة", "الزبوجة"]
  },
  {
    id: 3,
    code: "03",
    name: "الأغواط",
    nameEn: "Laghouat",
    shippingHome: 800,
    shippingPickup: 500,
    communes: ["الأغواط", "آفلو", "عين ماضي", "تاجرونة", "حاسي الرمل", "سيدي مخلوف", "قصر الحيران"]
  },
  {
    id: 4,
    code: "04",
    name: "أم البواقي",
    nameEn: "Oum El Bouaghi",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["أم البواقي", "عين البيضاء", "عين مليلة", "مسكيانة", "عين كرشة", "سوق نعمان", "عين تندلة"]
  },
  {
    id: 5,
    code: "05",
    name: "باتنة",
    nameEn: "Batna",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["باتنة", "أريس", "بريكة", "مروانة", "عين توتة", "نقاوس", "شمرة", "المعذر", "تازولت"]
  },
  {
    id: 6,
    code: "06",
    name: "بجاية",
    nameEn: "Béjaïa",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["بجاية", "أقبو", "خراطة", "أدكار", "صدوق", "تيشي", "أميزور", "أوقاس", "القصر"]
  },
  {
    id: 7,
    code: "07",
    name: "بسكرة",
    nameEn: "Biskra",
    shippingHome: 800,
    shippingPickup: 500,
    communes: ["بسكرة", "طولقة", "سيدي عقبة", "زريبة الوادي", "جمورة", "الوطاية", "فوغالة", "مشونش"]
  },
  {
    id: 8,
    code: "08",
    name: "بشار",
    nameEn: "Béchar",
    shippingHome: 1000,
    shippingPickup: 650,
    communes: ["بشار", "القنادسة", "تاغيت", "العبادلة", "بني ونيف", "لحمر", "موغل"]
  },
  {
    id: 9,
    code: "09",
    name: "البليدة",
    nameEn: "Blida",
    shippingHome: 500,
    shippingPickup: 300,
    communes: ["البليدة", "أولاد يعيش", "الصومعة", "بوفاريك", "العفرون", "موزاية", "الشبلي", "بوعرفة", "مفتاح", "الأربعاء"]
  },
  {
    id: 10,
    code: "10",
    name: "البويرة",
    nameEn: "Bouira",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["البويرة", "الأخضرية", "عين بسام", "سور الغزلان", "مشد الله", "قاديرية", "بشلول", "حيزر"]
  },
  {
    id: 11,
    code: "11",
    name: "تمنراست",
    nameEn: "Tamanrasset",
    shippingHome: 1000,
    shippingPickup: 650,
    communes: ["تمنراست", "أبالسا", "تاظروك", "إدلس"]
  },
  {
    id: 12,
    code: "12",
    name: "تبسة",
    nameEn: "Tébessa",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["تبسة", "بئر العاتر", "الشريعة", "الونزة", "العوينات", "المرمج", "الكويف", "العقلة"]
  },
  {
    id: 13,
    code: "13",
    name: "تلمسان",
    nameEn: "Tlemcen",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["تلمسان", "منصورة", "مغنية", "الغزوات", "سبدو", "أولاد ميمون", "الحناية", "ندرومة", "شتوان"]
  },
  {
    id: 14,
    code: "14",
    name: "تيارت",
    nameEn: "Tiaret",
    shippingHome: 700,
    shippingPickup: 450,
    communes: ["تيارت", "السوقر", "فرندة", "قصر الشلالة", "مهدية", "الدحموني", "مدروسة", "تيدة"]
  },
  {
    id: 15,
    code: "15",
    name: "تيزي وزو",
    nameEn: "Tizi Ouzou",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["تيزي وزو", "عزازقة", "ذراع الميزان", "عين الحمام", "واسيف", "تيقزيرت", "لاربعاء ناث ايراثن", "بودجيمة", "مقلع"]
  },
  {
    id: 16,
    code: "16",
    name: "الجزائر العاصمة",
    nameEn: "Algiers",
    shippingHome: 400,
    shippingPickup: 150,
    communes: [
      "الجزائر الوسطى", "باب الوادي", "سيدي امحمد", "الحراش", "بئر مراد رايس", 
      "دالي ابراهيم", "الشراقة", "الكاليتوس", "برج الكيفان", "رويبة", 
      "عين طاية", "زرالدة", "الأبيار", "بن عكنون", "المرادية", "باش جراح",
      "الدار البيضاء", "برج البحري", "المحمدية", "واد السمار", "بئر خادم"
    ]
  },
  {
    id: 17,
    code: "17",
    name: "الجلفة",
    nameEn: "Djelfa",
    shippingHome: 700,
    shippingPickup: 450,
    communes: ["الجلفة", "حاسي بحبح", "عين وسارة", "مسعد", "الشارف", "دار الشيوخ", "البيرين", "حد الصحاري"]
  },
  {
    id: 18,
    code: "18",
    name: "جيجل",
    nameEn: "Jijel",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["جيجل", "طاهير", "الميلية", "العوانة", "زيامة منصورية", "الشقفة", "قاوس", "العنصر"]
  },
  {
    id: 19,
    code: "19",
    name: "سطيف",
    nameEn: "Sétif",
    shippingHome: 500,
    shippingPickup: 300,
    communes: ["سطيف", "العلمة", "عين الكبيرة", "عين ولمان", "بوقاعة", "عموشة", "صالح باي", "عين أرنات", "جميلة"]
  },
  {
    id: 20,
    code: "20",
    name: "سعيدة",
    nameEn: "Saïda",
    shippingHome: 700,
    shippingPickup: 450,
    communes: ["سعيدة", "الحساسنة", "أولاد خالد", "عين الحجر", "يوب", "سيدي بوبكر"]
  },
  {
    id: 21,
    code: "21",
    name: "سكيكدة",
    nameEn: "Skikda",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["سكيكدة", "الحروش", "القل", "عزابة", "تمالوس", "حمادي كرومة", "فلفلة", "الحدائق", "مجاز الدشيش"]
  },
  {
    id: 22,
    code: "22",
    name: "سيدي بلعباس",
    nameEn: "Sidi Bel Abbès",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["سيدي بلعباس", "تلاغ", "سفيزف", "ابن باديس", "مصطفى بن براهيم", "مراين", "تلموني", "سيدي لحسن"]
  },
  {
    id: 23,
    code: "23",
    name: "عنابة",
    nameEn: "Annaba",
    shippingHome: 550,
    shippingPickup: 350,
    communes: ["عنابة", "البوني", "الحجار", "برحال", "سرايدي", "شطايبي", "عين الباردة", "التريعات"]
  },
  {
    id: 24,
    code: "24",
    name: "قالمة",
    nameEn: "Guelma",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["قالمة", "هليوبوليس", "بوشقوف", "وادي الزناتي", "حمام دباغ", "لخزارة", "بلخير", "قلعة بوصبع"]
  },
  {
    id: 25,
    code: "25",
    name: "قسنطينة",
    nameEn: "Constantine",
    shippingHome: 500,
    shippingPickup: 300,
    communes: ["قسنطينة", "الخروب", "حامة بوزيان", "عين سمارة", "زيغود يوسف", "ابن زياد", "المدينة الجديدة علي منجلي"]
  },
  {
    id: 26,
    code: "26",
    name: "المدية",
    nameEn: "Médéa",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["المدية", "وزرة", "البرواقية", "قصر البخاري", "بني سليمان", "شلالة العذاورة", "تابلاط", "سغوان"]
  },
  {
    id: 27,
    code: "27",
    name: "مستغانم",
    nameEn: "Mostaganem",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["مستغانم", "عين تادلس", "سيدي لخضر", "ماسرة", "حاسي ماماش", "مزغران", "بوقيرات", "عشعاشة"]
  },
  {
    id: 28,
    code: "28",
    name: "المسيلة",
    nameEn: "M'Sila",
    shippingHome: 700,
    shippingPickup: 450,
    communes: ["المسيلة", "بوسعادة", "مقرة", "سيدي عيسى", "أولاد دراج", "العش", "حمام الضلعة", "تارمونت"]
  },
  {
    id: 29,
    code: "29",
    name: "معسكر",
    nameEn: "Mascara",
    shippingHome: 700,
    shippingPickup: 450,
    communes: ["معسكر", "سيق", "المحمدية", "غريس", "تيغنيف", "بوحنيفية", "هاشم", "عوف"]
  },
  {
    id: 30,
    code: "30",
    name: "ورقلة",
    nameEn: "Ouargla",
    shippingHome: 800,
    shippingPickup: 500,
    communes: ["ورقلة", "حاسي مسعود", "الرويسات", "عين البيضاء", "أنقوسة", "سيدي خويلد"]
  },
  {
    id: 31,
    code: "31",
    name: "وهران",
    nameEn: "Oran",
    shippingHome: 500,
    shippingPickup: 300,
    communes: ["وهران", "بئر الجير", "السانية", "قديل", "أرزيو", "عين الترك", "بوتليليس", "مسرغين", "سيدي الشحمي", "حاسي بونيف"]
  },
  {
    id: 32,
    code: "32",
    name: "البيض",
    nameEn: "El Bayadh",
    shippingHome: 800,
    shippingPickup: 500,
    communes: ["البيض", "بوقطب", "الأبيض سيدي الشيخ", "بريزينة", "شلالة", "الغاسول"]
  },
  {
    id: 33,
    code: "33",
    name: "إليزي",
    nameEn: "Illizi",
    shippingHome: 1000,
    shippingPickup: 650,
    communes: ["إليزي", "برج عمر إدريس", "إن أميناس", "دبداب"]
  },
  {
    id: 34,
    code: "34",
    name: "برج بوعريريج",
    nameEn: "Bordj Bou Arréridj",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["برج بوعريريج", "رأس الوادي", "مجانة", "البرج", "بومرقد", "اليشير", "المنصورة", "حمراء"]
  },
  {
    id: 35,
    code: "35",
    name: "بومرداس",
    nameEn: "Boumerdès",
    shippingHome: 500,
    shippingPickup: 300,
    communes: ["بومرداس", "بودواو", "خميس الخشنة", "دلس", "الثنية", "برج منايل", "يسر", "الناصرية", "حمادي", "الرويبة"]
  },
  {
    id: 36,
    code: "36",
    name: "الطارف",
    nameEn: "El Tarf",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["الطارف", "القالة", "ذرعان", "بوثلجة", "بن مهيدي", "البسباس", "الشط"]
  },
  {
    id: 37,
    code: "37",
    name: "تندوف",
    nameEn: "Tindouf",
    shippingHome: 1000,
    shippingPickup: 650,
    communes: ["تندوف", "أم العسل"]
  },
  {
    id: 38,
    code: "38",
    name: "تيسمسيلت",
    nameEn: "Tissemsilt",
    shippingHome: 700,
    shippingPickup: 450,
    communes: ["تيسمسيلت", "ثنية الحد", "لرجام", "خميستي", "برج الأمير عبد القادر", "عماري"]
  },
  {
    id: 39,
    code: "39",
    name: "الوادي",
    nameEn: "El Oued",
    shippingHome: 800,
    shippingPickup: 500,
    communes: ["الوادي", "قمار", "كوينين", "البياضة", "الحمراية", "الرباح", "حاسي خليفة", "الرقيبة"]
  },
  {
    id: 40,
    code: "40",
    name: "خنشلة",
    nameEn: "Khenchela",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["خنشلة", "ششار", "قايس", "أولاد رشاش", "ببار", "الحامة", "عين طويلة"]
  },
  {
    id: 41,
    code: "41",
    name: "سوق أهراس",
    nameEn: "Souk Ahras",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["سوق أهراس", "المداوروش", "سدراتة", "تاورة", "لحدادة", "المشروحة", "بير بوحوش"]
  },
  {
    id: 42,
    code: "42",
    name: "تيبازة",
    nameEn: "Tipaza",
    shippingHome: 500,
    shippingPickup: 300,
    communes: ["تيبازة", "شرشال", "حجوط", "بوسماعيل", "القليعة", "الداموس", "فوكة", "سيدي غيلاس", "حمر العين"]
  },
  {
    id: 43,
    code: "43",
    name: "ميلة",
    nameEn: "Mila",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["ميلة", "شلغوم العيد", "فرجيوة", "تاجنانت", "القرارم قوقة", "وادي العثمانية", "التلاغمة", "سيدي مروان"]
  },
  {
    id: 44,
    code: "44",
    name: "عين الدفلى",
    nameEn: "Aïn Defla",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["عين الدفلى", "خميس مليانة", "مليانة", "العطاف", "جندل", "روينة", "العبادية", "برج الأمير خالد"]
  },
  {
    id: 45,
    code: "45",
    name: "النعامة",
    nameEn: "Naâma",
    shippingHome: 800,
    shippingPickup: 500,
    communes: ["النعامة", "المشرية", "عين الصفراء", "عسلة", "صفيصيفة", "مغرار"]
  },
  {
    id: 46,
    code: "46",
    name: "عين تموشنت",
    nameEn: "Aïn Témouchent",
    shippingHome: 600,
    shippingPickup: 400,
    communes: ["عين تموشنت", "حمام بوحجر", "بني صاف", "العامرية", "المالح", "تارقة", "ولهاصة الغرابة"]
  },
  {
    id: 47,
    code: "47",
    name: "غرداية",
    nameEn: "Ghardaïa",
    shippingHome: 800,
    shippingPickup: 500,
    communes: ["غرداية", "متليلي", "العطف", "بن يزقن", "ضاية بن ضحوة", "القرارة", "زلفانة", "بريان"]
  },
  {
    id: 48,
    code: "48",
    name: "غليزان",
    nameEn: "Relizane",
    shippingHome: 700,
    shippingPickup: 450,
    communes: ["غليزان", "وادي ارهيو", "الحمادنة", "مازونة", "عمي موسى", "يلل", "المطمر", "جديوية", "منداس"]
  },
  {
    id: 49,
    code: "49",
    name: "تيميمون",
    nameEn: "Timimoun",
    shippingHome: 1000,
    shippingPickup: 650,
    communes: ["تيميمون", "أوقروت", "تنركوك", "مطارفة", "شروين"]
  },
  {
    id: 50,
    code: "50",
    name: "برج باجي مختار",
    nameEn: "Bordj Badji Mokhtar",
    shippingHome: 1100,
    shippingPickup: 700,
    communes: ["برج باجي مختار", "تيمياوين"]
  },
  {
    id: 51,
    code: "51",
    name: "أولاد جلال",
    nameEn: "Ouled Djellal",
    shippingHome: 800,
    shippingPickup: 500,
    communes: ["أولاد جلال", "سيدي خالد", "الدوسن", "الشعيبة", "البسباس"]
  },
  {
    id: 52,
    code: "52",
    name: "بني عباس",
    nameEn: "Béni Abbès",
    shippingHome: 1000,
    shippingPickup: 650,
    communes: ["بني عباس", "كرزاز", "الواتة", "أبو الحسن", "القصابي", "تامترت"]
  },
  {
    id: 53,
    code: "53",
    name: "عين صالح",
    nameEn: "In Salah",
    shippingHome: 1000,
    shippingPickup: 650,
    communes: ["عين صالح", "فقارة الزوى", "إن غار"]
  },
  {
    id: 54,
    code: "54",
    name: "عين قزام",
    nameEn: "In Guezzam",
    shippingHome: 1100,
    shippingPickup: 750,
    communes: ["عين قزام", "تين زواتين"]
  },
  {
    id: 55,
    code: "55",
    name: "توقرت",
    nameEn: "Touggourt",
    shippingHome: 800,
    shippingPickup: 500,
    communes: ["توقرت", "تماسين", "الطيبات", "المقارين", "سيدي سليمان", "المنقر", "الحجيرة"]
  },
  {
    id: 56,
    code: "56",
    name: "جانت",
    nameEn: "Djanet",
    shippingHome: 1100,
    shippingPickup: 750,
    communes: ["جانت", "برج الحواس"]
  },
  {
    id: 57,
    code: "57",
    name: "المغير",
    nameEn: "El M'Ghair",
    shippingHome: 850,
    shippingPickup: 550,
    communes: ["المغير", "جامعة", "أم الطيور", "سيدي عمران"]
  },
  {
    id: 58,
    code: "58",
    name: "المنيعة",
    nameEn: "El Meniaa",
    shippingHome: 900,
    shippingPickup: 600,
    communes: ["المنيعة", "حاسي القارة", "حاسي الفحل"]
  }
];
