// Mock data for Markaz Al-Rahma website

export const mosqueInfo = {
  name: "Markaz Al-Rahma",
  fullName: "Markaz Al-Rahma",
  description: "Dedicated to serving the local Muslim community in Colindale, Burnt Oak, Edgware and surrounding areas with prayer services, Islamic education, and community support.",
  location: {
    address: "15a Carlisle Road, London, NW9 0HD",
    coordinates: {
      lat: 51.590636,
      lng: -0.25
    }
  },
  contact: {
    email: "info@markazrahma.org"
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
    accountName: "Markaz Al Rahma",
    sortCode: "20-92-63",
    accountNumber: "53805387",
    bankType: "Business"
  }
};

export const aboutContent = {
  mission: "Our mission is to provide a welcoming space for worship, learning, and community building, following the teachings of the Quran and Sunnah.",
  vision: "To create a thriving Islamic community center that serves as a beacon of knowledge, compassion, and unity in Colindale.",
  values: [
    {
      title: "Creed",
      description: "Adhering strictly to the Quran and authentic Sunnah under the understanding of the Salaf"
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
