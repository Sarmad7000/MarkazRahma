// Mock data for Markaz Al-Rahma website

export const mosqueInfo = {
  name: "Markaz Al-Rahma",
  fullName: "Al-Rahma Centre",
  tagline: "The Centre of Mercy",
  description: "A small community mosque in Colindale, London, dedicated to serving the local Muslim community with prayer services, Islamic education, and community support.",
  location: {
    address: "Colindale, London",
    coordinates: {
      lat: 51.590636,
      lng: -0.25
    }
  },
  contact: {
    email: "info@markazrahma.org",
    phone: "+44 20 1234 5678"
  },
  social: {
    twitter: "@MarkazRahma",
    twitterUrl: "https://twitter.com/MarkazRahma"
  }
};

export const prayerTimes = {
  today: "Monday, 3rd March 2025",
  hijriDate: "3 Ramadan 1446",
  prayers: [
    {
      name: "Fajr",
      adhan: "05:45",
      iqamah: "06:00"
    },
    {
      name: "Dhuhr",
      adhan: "12:30",
      iqamah: "12:45"
    },
    {
      name: "Asr",
      adhan: "15:45",
      iqamah: "16:00"
    },
    {
      name: "Maghrib",
      adhan: "18:15",
      iqamah: "18:20"
    },
    {
      name: "Isha",
      adhan: "20:00",
      iqamah: "20:15"
    }
  ],
  jummah: {
    khutbah: "13:00",
    salah: "13:30"
  }
};

export const donationInfo = {
  title: "Support Our Expansion",
  message: "As a small community mosque, we are striving to expand our space to better serve our growing community. Your donations help us provide prayer facilities, Islamic education, and community services.",
  bankTransfer: {
    bankName: "Example Bank",
    accountName: "Markaz Al-Rahma",
    sortCode: "12-34-56",
    accountNumber: "12345678",
    reference: "Donation"
  },
  stats: [
    {
      label: "Families Served",
      value: "150+"
    },
    {
      label: "Weekly Programs",
      value: "5"
    },
    {
      label: "Years Serving",
      value: "10+"
    }
  ]
};

export const aboutContent = {
  mission: "Our mission is to provide a welcoming space for worship, learning, and community building, following the teachings of the Quran and Sunnah.",
  vision: "To create a thriving Islamic community center that serves as a beacon of knowledge, compassion, and unity in Colindale.",
  values: [
    {
      title: "Faith",
      description: "Adhering strictly to the Quran and authentic Sunnah"
    },
    {
      title: "Community",
      description: "Building strong bonds among Muslims in our area"
    },
    {
      title: "Education",
      description: "Providing Islamic knowledge to all age groups"
    },
    {
      title: "Service",
      description: "Supporting those in need within our community"
    }
  ]
};

export const facilities = [
  "Prayer hall (separate areas for men and women)",
  "Wudu facilities",
  "Quran classes for children",
  "Islamic library",
  "Community events and lectures"
];

export const weeklyPrograms = [
  {
    day: "Monday",
    program: "Quran Memorization Circle",
    time: "6:30 PM"
  },
  {
    day: "Wednesday",
    program: "Islamic Studies Class",
    time: "7:00 PM"
  },
  {
    day: "Friday",
    program: "Jummah Prayer",
    time: "1:00 PM"
  },
  {
    day: "Saturday",
    program: "Youth Program",
    time: "4:00 PM"
  },
  {
    day: "Sunday",
    program: "Family Day",
    time: "2:00 PM"
  }
];
