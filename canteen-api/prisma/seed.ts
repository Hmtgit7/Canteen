import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ── Users ──────────────────────────────────────────────────────────
  const adminIndia = await prisma.user.upsert({
    where: { email: 'admin@canteen.in' },
    update: {},
    create: {
      email: 'admin@canteen.in',
      name: 'Rahul Sharma',
      password: hashedPassword,
      role: 'ADMIN',
      country: 'INDIA',
    },
  });

  // const managerIndia = await prisma.user.upsert({
  //   where: { email: 'manager@canteen.in' },
  //   update: {},
  //   create: {
  //     email: 'manager@canteen.in',
  //     name: 'Priya Patel',
  //     password: hashedPassword,
  //     role: 'MANAGER',
  //     country: 'INDIA',
  //   },
  // });

  await prisma.user.upsert({
    where: { email: 'member@canteen.in' },
    update: {},
    create: {
      email: 'member@canteen.in',
      name: 'Amit Kumar',
      password: hashedPassword,
      role: 'MEMBER',
      country: 'INDIA',
    },
  });

  const adminUS = await prisma.user.upsert({
    where: { email: 'admin@canteen.us' },
    update: {},
    create: {
      email: 'admin@canteen.us',
      name: 'John Smith',
      password: hashedPassword,
      role: 'ADMIN',
      country: 'AMERICA',
    },
  });

  await prisma.user.upsert({
    where: { email: 'member@canteen.us' },
    update: {},
    create: {
      email: 'member@canteen.us',
      name: 'Emily Johnson',
      password: hashedPassword,
      role: 'MEMBER',
      country: 'AMERICA',
    },
  });

  // ── Indian Restaurants ────────────────────────────────────────────
  const spiceGarden = await prisma.restaurant.upsert({
    where: { id: 'rest-india-1' },
    update: {},
    create: {
      id: 'rest-india-1',
      name: 'Spice Garden',
      description: 'Authentic North Indian cuisine with royal recipes',
      cuisine: 'North Indian',
      country: 'INDIA',
      city: 'Mumbai',
      address: '12, MG Road, Bandra West, Mumbai',
      rating: 4.5,
      reviewCount: 234,
      imageUrl:
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    },
  });

  const biryaniBrothers = await prisma.restaurant.upsert({
    where: { id: 'rest-india-2' },
    update: {},
    create: {
      id: 'rest-india-2',
      name: 'Biryani Brothers',
      description: 'Legendary Hyderabadi dum biryani since 1995',
      cuisine: 'Hyderabadi',
      country: 'INDIA',
      city: 'Hyderabad',
      address: '45, Banjara Hills Road No. 12, Hyderabad',
      rating: 4.7,
      reviewCount: 892,
      imageUrl:
        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
    },
  });

  const dosaDhaba = await prisma.restaurant.upsert({
    where: { id: 'rest-india-3' },
    update: {},
    create: {
      id: 'rest-india-3',
      name: 'Dosa Dhaba',
      description: 'South Indian breakfast and meals all day',
      cuisine: 'South Indian',
      country: 'INDIA',
      city: 'Bangalore',
      address: '78, Indiranagar 100ft Road, Bangalore',
      rating: 4.3,
      reviewCount: 456,
      imageUrl:
        'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',
    },
  });

  // ── US Restaurants ────────────────────────────────────────────────
  const burgerBarn = await prisma.restaurant.upsert({
    where: { id: 'rest-us-1' },
    update: {},
    create: {
      id: 'rest-us-1',
      name: 'Burger Barn',
      description: 'Craft burgers and loaded fries since 2010',
      cuisine: 'American',
      country: 'AMERICA',
      city: 'New York',
      address: '123 5th Avenue, Manhattan, New York',
      rating: 4.4,
      reviewCount: 678,
      imageUrl:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    },
  });

  const pizzaPalace = await prisma.restaurant.upsert({
    where: { id: 'rest-us-2' },
    update: {},
    create: {
      id: 'rest-us-2',
      name: 'Pizza Palace',
      description: 'New York style thin crust pizza and calzones',
      cuisine: 'Italian-American',
      country: 'AMERICA',
      city: 'Chicago',
      address: '456 Michigan Ave, Chicago, IL',
      rating: 4.6,
      reviewCount: 1023,
      imageUrl:
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    },
  });

  const tacoTruck = await prisma.restaurant.upsert({
    where: { id: 'rest-us-3' },
    update: {},
    create: {
      id: 'rest-us-3',
      name: 'Taco Town',
      description: 'Authentic Mexican tacos, burritos, and bowls',
      cuisine: 'Mexican',
      country: 'AMERICA',
      city: 'Los Angeles',
      address: '789 Sunset Blvd, Los Angeles, CA',
      rating: 4.2,
      reviewCount: 345,
      imageUrl:
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    },
  });

  // ── Menu Items ────────────────────────────────────────────────────

  // Spice Garden
  await prisma.menuItem.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'mi-sg-1',
        name: 'Butter Chicken',
        description: 'Creamy tomato-based chicken curry',
        price: 320,
        category: 'Main Course',
        restaurantId: spiceGarden.id,
        isVeg: false,
        calories: 450,
        imageUrl:
          'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400',
      },
      {
        id: 'mi-sg-2',
        name: 'Paneer Tikka Masala',
        description: 'Grilled cottage cheese in spiced gravy',
        price: 280,
        category: 'Main Course',
        restaurantId: spiceGarden.id,
        isVeg: true,
        calories: 380,
      },
      {
        id: 'mi-sg-3',
        name: 'Dal Makhani',
        description: 'Slow-cooked black lentils with cream',
        price: 220,
        category: 'Main Course',
        restaurantId: spiceGarden.id,
        isVeg: true,
        calories: 320,
      },
      {
        id: 'mi-sg-4',
        name: 'Garlic Naan',
        description: 'Soft bread with garlic and butter',
        price: 60,
        category: 'Breads',
        restaurantId: spiceGarden.id,
        isVeg: true,
        calories: 180,
      },
      {
        id: 'mi-sg-5',
        name: 'Mango Lassi',
        description: 'Chilled yogurt drink with Alphonso mango',
        price: 120,
        category: 'Beverages',
        restaurantId: spiceGarden.id,
        isVeg: true,
        calories: 200,
      },
      {
        id: 'mi-sg-6',
        name: 'Gulab Jamun',
        description: 'Soft milk-solid dumplings in sugar syrup',
        price: 90,
        category: 'Desserts',
        restaurantId: spiceGarden.id,
        isVeg: true,
        calories: 250,
      },
    ],
  });

  // Biryani Brothers
  await prisma.menuItem.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'mi-bb-1',
        name: 'Hyderabadi Chicken Biryani',
        description: 'Dum-cooked basmati rice with tender chicken',
        price: 380,
        category: 'Biryani',
        restaurantId: biryaniBrothers.id,
        isVeg: false,
        calories: 650,
      },
      {
        id: 'mi-bb-2',
        name: 'Mutton Biryani',
        description: 'Slow-cooked mutton with aromatic spices',
        price: 450,
        category: 'Biryani',
        restaurantId: biryaniBrothers.id,
        isVeg: false,
        calories: 720,
      },
      {
        id: 'mi-bb-3',
        name: 'Veg Biryani',
        description: 'Fresh vegetables with saffron-infused rice',
        price: 280,
        category: 'Biryani',
        restaurantId: biryaniBrothers.id,
        isVeg: true,
        calories: 480,
      },
      {
        id: 'mi-bb-4',
        name: 'Raita',
        description: 'Cooling yogurt with cucumber and mint',
        price: 60,
        category: 'Sides',
        restaurantId: biryaniBrothers.id,
        isVeg: true,
        calories: 80,
      },
      {
        id: 'mi-bb-5',
        name: 'Mirchi Ka Salan',
        description: 'Green chilies in tangy peanut gravy',
        price: 120,
        category: 'Sides',
        restaurantId: biryaniBrothers.id,
        isVeg: true,
        calories: 150,
      },
    ],
  });

  // Dosa Dhaba
  await prisma.menuItem.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'mi-dd-1',
        name: 'Masala Dosa',
        description: 'Crispy rice crepe with spiced potato filling',
        price: 120,
        category: 'Dosa',
        restaurantId: dosaDhaba.id,
        isVeg: true,
        calories: 300,
      },
      {
        id: 'mi-dd-2',
        name: 'Rava Idli',
        description: 'Steamed semolina cakes with sambar',
        price: 90,
        category: 'Idli',
        restaurantId: dosaDhaba.id,
        isVeg: true,
        calories: 220,
      },
      {
        id: 'mi-dd-3',
        name: 'Vada Sambar',
        description: 'Crispy lentil donuts dipped in sambar',
        price: 100,
        category: 'Vada',
        restaurantId: dosaDhaba.id,
        isVeg: true,
        calories: 280,
      },
      {
        id: 'mi-dd-4',
        name: 'Filter Coffee',
        description: 'Strong South Indian decoction coffee with milk',
        price: 50,
        category: 'Beverages',
        restaurantId: dosaDhaba.id,
        isVeg: true,
        calories: 100,
      },
    ],
  });

  // Burger Barn
  await prisma.menuItem.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'mi-bg-1',
        name: 'Classic Smash Burger',
        description: 'Double smash patty with American cheese',
        price: 14.99,
        category: 'Burgers',
        restaurantId: burgerBarn.id,
        isVeg: false,
        calories: 680,
      },
      {
        id: 'mi-bg-2',
        name: 'BBQ Bacon Burger',
        description: 'Crispy bacon with smoky BBQ sauce',
        price: 16.99,
        category: 'Burgers',
        restaurantId: burgerBarn.id,
        isVeg: false,
        calories: 820,
      },
      {
        id: 'mi-bg-3',
        name: 'Veggie Black Bean Burger',
        description: 'House-made black bean patty with avocado',
        price: 13.99,
        category: 'Burgers',
        restaurantId: burgerBarn.id,
        isVeg: true,
        calories: 520,
      },
      {
        id: 'mi-bg-4',
        name: 'Loaded Fries',
        description: 'Thick-cut fries with cheese sauce and jalapeños',
        price: 8.99,
        category: 'Sides',
        restaurantId: burgerBarn.id,
        isVeg: true,
        calories: 450,
      },
      {
        id: 'mi-bg-5',
        name: 'Vanilla Milkshake',
        description: 'Thick hand-spun vanilla milkshake',
        price: 6.99,
        category: 'Beverages',
        restaurantId: burgerBarn.id,
        isVeg: true,
        calories: 520,
      },
    ],
  });

  // Pizza Palace
  await prisma.menuItem.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'mi-pp-1',
        name: 'Margherita Pizza',
        description: 'Classic tomato, fresh mozzarella, basil',
        price: 18.99,
        category: 'Pizza',
        restaurantId: pizzaPalace.id,
        isVeg: true,
        calories: 760,
      },
      {
        id: 'mi-pp-2',
        name: 'Pepperoni Pizza',
        description: 'Extra crispy pepperoni on house tomato sauce',
        price: 21.99,
        category: 'Pizza',
        restaurantId: pizzaPalace.id,
        isVeg: false,
        calories: 920,
      },
      {
        id: 'mi-pp-3',
        name: 'BBQ Chicken Pizza',
        description: 'Smoky BBQ sauce with grilled chicken and red onion',
        price: 23.99,
        category: 'Pizza',
        restaurantId: pizzaPalace.id,
        isVeg: false,
        calories: 880,
      },
      {
        id: 'mi-pp-4',
        name: 'Caesar Salad',
        description: 'Romaine, house-made Caesar dressing, croutons',
        price: 10.99,
        category: 'Salads',
        restaurantId: pizzaPalace.id,
        isVeg: true,
        calories: 340,
      },
      {
        id: 'mi-pp-5',
        name: 'Garlic Breadsticks',
        description: 'Oven-fresh with garlic butter and marinara',
        price: 7.99,
        category: 'Sides',
        restaurantId: pizzaPalace.id,
        isVeg: true,
        calories: 380,
      },
    ],
  });

  // Taco Town
  await prisma.menuItem.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'mi-tt-1',
        name: 'Carne Asada Tacos',
        description: 'Grilled marinated beef with cilantro and onion',
        price: 12.99,
        category: 'Tacos',
        restaurantId: tacoTruck.id,
        isVeg: false,
        calories: 420,
      },
      {
        id: 'mi-tt-2',
        name: 'Chicken Burrito',
        description: 'Grilled chicken, rice, beans, pico de gallo',
        price: 13.99,
        category: 'Burritos',
        restaurantId: tacoTruck.id,
        isVeg: false,
        calories: 680,
      },
      {
        id: 'mi-tt-3',
        name: 'Veggie Bowl',
        description: 'Black beans, roasted peppers, guacamole, rice',
        price: 11.99,
        category: 'Bowls',
        restaurantId: tacoTruck.id,
        isVeg: true,
        calories: 520,
      },
      {
        id: 'mi-tt-4',
        name: 'Chips & Guacamole',
        description: 'Fresh-made guacamole with house tortilla chips',
        price: 7.99,
        category: 'Sides',
        restaurantId: tacoTruck.id,
        isVeg: true,
        calories: 380,
      },
      {
        id: 'mi-tt-5',
        name: 'Horchata',
        description: 'Traditional rice milk drink with cinnamon',
        price: 4.99,
        category: 'Beverages',
        restaurantId: tacoTruck.id,
        isVeg: true,
        calories: 180,
      },
    ],
  });

  // ── Payment Methods ───────────────────────────────────────────────
  await prisma.paymentMethod.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'pm-1',
        type: 'CARD',
        label: 'HDFC Credit Card',
        last4: '4242',
        isDefault: true,
        userId: adminIndia.id,
      },
      {
        id: 'pm-2',
        type: 'UPI',
        label: 'Google Pay UPI',
        isDefault: false,
        userId: adminIndia.id,
      },
      {
        id: 'pm-3',
        type: 'CARD',
        label: 'Chase Visa',
        last4: '8888',
        isDefault: true,
        userId: adminUS.id,
      },
    ],
  });

  console.log('✅ Seeding complete!');
  console.log('\n📋 Test Accounts (password: password123)');
  console.log('  🇮🇳 admin@canteen.in   — Admin   India');
  console.log('  🇮🇳 manager@canteen.in — Manager India');
  console.log('  🇮🇳 member@canteen.in  — Member  India');
  console.log('  🇺🇸 admin@canteen.us   — Admin   America');
  console.log('  🇺🇸 member@canteen.us  — Member  America');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
