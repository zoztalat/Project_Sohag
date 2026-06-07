// diseaseData.ts
// 35 skin diseases with YouTube search queries (English + Arabic)

export interface Disease {
  id: string;
  displayName: string;
  category: string;
  color: string;
  searchQuery: string;    // English YouTube search
  searchQueryAr: string;  // Arabic YouTube search
}

export const diseases: Disease[] = [
  { id: 'acne_rosacea',        displayName: 'Acne & Rosacea',                    category: 'Inflammatory',   color: 'bg-red-500',     searchQuery: 'acne rosacea treatment dermatology',                        searchQueryAr: 'حب الشباب والوردية علاج طب الجلدية' },
  { id: 'actinic_keratosis',   displayName: 'Actinic Keratosis & Skin Cancer',   category: 'Malignant',      color: 'bg-gray-700',    searchQuery: 'actinic keratosis basal cell carcinoma treatment',           searchQueryAr: 'التقران الشعاعي سرطان الجلد علاج' },
  { id: 'atopic_dermatitis',   displayName: 'Atopic Dermatitis',                 category: 'Inflammatory',   color: 'bg-orange-400',  searchQuery: 'atopic dermatitis eczema treatment dermatology',             searchQueryAr: 'التهاب الجلد التأتبي أكزيما علاج' },
  { id: 'cellulitis',          displayName: 'Cellulitis',                        category: 'Bacterial',      color: 'bg-yellow-600',  searchQuery: 'cellulitis bacterial skin infection treatment',               searchQueryAr: 'التهاب النسيج الخلوي عدوى جلدية بكتيرية علاج' },
  { id: 'impetigo',            displayName: 'Impetigo',                          category: 'Bacterial',      color: 'bg-yellow-500',  searchQuery: 'impetigo bacterial skin infection treatment children',        searchQueryAr: 'القوباء عدوى جلدية بكتيرية علاج الأطفال' },
  { id: 'benign_tumors',       displayName: 'Benign Skin Tumors',                category: 'Benign',         color: 'bg-green-500',   searchQuery: 'benign skin tumor lipoma cyst dermatology',                  searchQueryAr: 'أورام جلدية حميدة كيسة ليبوما علاج' },
  { id: 'bullous_disease',     displayName: 'Bullous Disease',                   category: 'Autoimmune',     color: 'bg-indigo-500',  searchQuery: 'bullous pemphigoid blistering skin disease treatment',       searchQueryAr: 'الفقاع الجلدي مرض البثور المناعي علاج' },
  { id: 'bacterial_infections',displayName: 'Bacterial Skin Infections',         category: 'Bacterial',      color: 'bg-amber-600',   searchQuery: 'bacterial skin infections types treatment dermatology',      searchQueryAr: 'التهابات جلدية بكتيرية أنواع وعلاج' },
  { id: 'eczema',              displayName: 'Eczema',                            category: 'Inflammatory',   color: 'bg-orange-500',  searchQuery: 'eczema treatment skincare routine dermatologist',            searchQueryAr: 'الأكزيما علاج العناية بالبشرة طبيب جلدية' },
  { id: 'drug_eruptions',      displayName: 'Exanthems & Drug Eruptions',        category: 'Reactive',       color: 'bg-rose-500',    searchQuery: 'drug eruption exanthem skin reaction treatment',             searchQueryAr: 'الطفح الجلدي الدوائي رد فعل تحسسي علاج' },
  { id: 'athletes_foot',       displayName: "Athlete's Foot",                    category: 'Fungal',         color: 'bg-teal-500',    searchQuery: "athlete's foot tinea pedis treatment antifungal",            searchQueryAr: 'قدم الرياضي سعفة القدم علاج مضادات الفطريات' },
  { id: 'nail_fungus',         displayName: 'Nail Fungus',                       category: 'Fungal',         color: 'bg-teal-600',    searchQuery: 'nail fungus onychomycosis treatment dermatology',            searchQueryAr: 'فطريات الأظافر علاج طب الجلدية' },
  { id: 'ringworm',            displayName: 'Ringworm',                          category: 'Fungal',         color: 'bg-teal-400',    searchQuery: 'ringworm tinea treatment antifungal dermatology',            searchQueryAr: 'سعفة الجلد قراع علاج مضادات الفطريات' },
  { id: 'hair_loss',           displayName: 'Hair Loss & Alopecia',              category: 'Hair Disorders', color: 'bg-purple-600',  searchQuery: 'hair loss alopecia treatment dermatology minoxidil',         searchQueryAr: 'تساقط الشعر الثعلبة علاج طب الجلدية مينوكسيديل' },
  { id: 'healthy_skin',        displayName: 'Healthy Skin',                      category: 'Prevention',     color: 'bg-green-400',   searchQuery: 'healthy skin routine dermatologist tips prevention',         searchQueryAr: 'روتين العناية بالبشرة الصحية نصائح طبيب الجلدية' },
  { id: 'herpes_hpv',          displayName: 'Herpes, HPV & STDs',                category: 'Viral',          color: 'bg-pink-600',    searchQuery: 'herpes HPV sexually transmitted infections skin treatment',  searchQueryAr: 'الهربس فيروس الورم الحليمي الأمراض الجلدية الفيروسية علاج' },
  { id: 'pigmentation',        displayName: 'Pigmentation Disorders',            category: 'Pigmentation',   color: 'bg-amber-400',   searchQuery: 'skin pigmentation vitiligo melasma treatment dermatology',  searchQueryAr: 'اضطرابات تصبغ الجلد البهاق الكلف علاج' },
  { id: 'lupus',               displayName: 'Lupus & Connective Tissue',         category: 'Autoimmune',     color: 'bg-violet-600',  searchQuery: 'lupus skin connective tissue disease treatment',             searchQueryAr: 'مرض الذئبة الحمراء أمراض النسيج الضام علاج' },
  { id: 'malignant',           displayName: 'Malignant Skin Conditions',         category: 'Malignant',      color: 'bg-slate-700',   searchQuery: 'malignant skin cancer treatment dermatology',               searchQueryAr: 'سرطان الجلد الخبيث علاج طب الجلدية' },
  { id: 'melanoma',            displayName: 'Melanoma & Moles',                  category: 'Malignant',      color: 'bg-gray-800',    searchQuery: 'melanoma skin cancer moles detection treatment',             searchQueryAr: 'الميلانوما سرطان الجلد الشامات تشخيص وعلاج' },
  { id: 'nail_disease',        displayName: 'Nail Diseases',                     category: 'Nail Disorders', color: 'bg-cyan-600',    searchQuery: 'nail disease disorders treatment dermatology',               searchQueryAr: 'أمراض الأظافر اضطرابات علاج طب الجلدية' },
  { id: 'larva_migrans',       displayName: 'Cutaneous Larva Migrans',           category: 'Parasitic',      color: 'bg-lime-600',    searchQuery: 'cutaneous larva migrans hookworm skin treatment',            searchQueryAr: 'اليرقات الجلدية المهاجرة دودة الخطاف علاج' },
  { id: 'contact_dermatitis',  displayName: 'Contact Dermatitis',                category: 'Inflammatory',   color: 'bg-green-700',   searchQuery: 'contact dermatitis poison ivy treatment dermatology',       searchQueryAr: 'التهاب الجلد التماسي الحساسية الجلدية علاج' },
  { id: 'psoriasis',           displayName: 'Psoriasis & Lichen Planus',         category: 'Inflammatory',   color: 'bg-fuchsia-600', searchQuery: 'psoriasis lichen planus treatment dermatology',              searchQueryAr: 'الصدفية الحزاز المسطح علاج طب الجلدية' },
  { id: 'rashes',              displayName: 'Skin Rashes',                       category: 'Inflammatory',   color: 'bg-red-400',     searchQuery: 'skin rash identification treatment dermatology',             searchQueryAr: 'الطفح الجلدي أنواع وأسباب وعلاج' },
  { id: 'scabies_lyme',        displayName: 'Scabies, Lyme & Infestations',      category: 'Parasitic',      color: 'bg-lime-700',    searchQuery: 'scabies lyme disease skin infestation treatment',            searchQueryAr: 'الجرب مرض لايم الأمراض الطفيلية الجلدية علاج' },
  { id: 'seborrheic_keratoses',displayName: 'Seborrheic Keratoses',              category: 'Benign',         color: 'bg-stone-500',   searchQuery: 'seborrheic keratosis benign skin lesion treatment removal',  searchQueryAr: 'التقران الدهني الحميد إزالة الآفات الجلدية' },
  { id: 'systemic_disease',    displayName: 'Systemic Disease & Skin',           category: 'Systemic',       color: 'bg-blue-700',    searchQuery: 'systemic disease skin manifestations dermatology',           searchQueryAr: 'الأمراض الجهازية ومظاهرها الجلدية طب الجلدية' },
  { id: 'tinea_candidiasis',   displayName: 'Tinea & Candidiasis',               category: 'Fungal',         color: 'bg-teal-700',    searchQuery: 'tinea candidiasis fungal skin infection treatment',          searchQueryAr: 'السعفة والمبيضات فطريات الجلد علاج' },
  { id: 'urticaria',           displayName: 'Urticaria (Hives)',                 category: 'Inflammatory',   color: 'bg-rose-400',    searchQuery: 'urticaria hives causes treatment dermatology',               searchQueryAr: 'الشرى الحساسية الجلدية أسباب وعلاج' },
  { id: 'vascular_tumors',     displayName: 'Vascular Tumors',                   category: 'Vascular',       color: 'bg-red-600',     searchQuery: 'vascular skin tumors hemangioma treatment dermatology',     searchQueryAr: 'الأورام الوعائية الجلدية الدموية علاج' },
  { id: 'vasculitis',          displayName: 'Vasculitis',                        category: 'Autoimmune',     color: 'bg-red-700',     searchQuery: 'vasculitis skin inflammation treatment dermatology',         searchQueryAr: 'التهاب الأوعية الدموية الجلدية علاج' },
  { id: 'chickenpox',          displayName: 'Chickenpox',                        category: 'Viral',          color: 'bg-sky-500',     searchQuery: 'chickenpox varicella treatment prevention vaccine',          searchQueryAr: 'جدري الماء الحماق علاج ووقاية لقاح' },
  { id: 'shingles',            displayName: 'Shingles (Herpes Zoster)',           category: 'Viral',          color: 'bg-sky-600',     searchQuery: 'shingles herpes zoster treatment prevention vaccine',        searchQueryAr: 'الهربس النطاقي الحزام الناري علاج ووقاية' },
  { id: 'warts_viral',         displayName: 'Warts, Molluscum & Viral',          category: 'Viral',          color: 'bg-sky-400',     searchQuery: 'warts molluscum viral skin infection treatment',             searchQueryAr: 'الثآليل الحليمات الفيروسية علاج إزالة' },
];

export const categoryColors: Record<string, string> = {
  Inflammatory:     'bg-red-100 text-red-700',
  Bacterial:        'bg-yellow-100 text-yellow-700',
  Fungal:           'bg-teal-100 text-teal-700',
  Viral:            'bg-sky-100 text-sky-700',
  Malignant:        'bg-gray-100 text-gray-700',
  Benign:           'bg-green-100 text-green-700',
  Autoimmune:       'bg-violet-100 text-violet-700',
  Parasitic:        'bg-lime-100 text-lime-700',
  Pigmentation:     'bg-amber-100 text-amber-700',
  Vascular:         'bg-rose-100 text-rose-700',
  Systemic:         'bg-blue-100 text-blue-700',
  'Hair Disorders': 'bg-purple-100 text-purple-700',
  'Nail Disorders': 'bg-cyan-100 text-cyan-700',
  Reactive:         'bg-orange-100 text-orange-700',
  Prevention:       'bg-emerald-100 text-emerald-700',
};

export const allCategories = Array.from(new Set(diseases.map((d) => d.category)));
