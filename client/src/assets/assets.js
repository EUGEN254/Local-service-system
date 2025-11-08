
import uploadArea from './uploadArea.svg'
import { FaClipboardList, FaCogs, FaDollarSign } from "react-icons/fa";
import avatar_icon from './avatar_icon.png'
import gallery_icon from './gallery_icon.svg'
import help_icon from './help_icon.png'
import logo_icon from './logo_icon.svg'
import logo_big from './logo_big.svg'
import logo from './logo.png'
import profile_richard from './profile_richard.png'
import profile_alison from './profile_alison.png'
import profile_enrique from './profile_enrique.png'
import profile_marco from './profile_marco.png'
import profile_martin from './profile_martin.png'
import search_icon from './search_icon.png'
import send_button from './send_button.svg'
import menu_icon from './menu_icon.png'
import arrow_icon from './arrow_icon.png'
import code from './code.svg'
import bgImage from './bgImage.svg'
import pic1 from './pic1.png'
import pic2 from './pic2.png'
import pic3 from './pic3.png'
import pic4 from './pic4.png'
import img1 from './img1.jpg'
import img2 from './img2.jpg'

export const assets = {
    avatar_icon,
    uploadArea,
    gallery_icon,
    help_icon,
    logo_big,
    logo_icon,
    logo,
    search_icon,
    send_button,
    menu_icon,
    arrow_icon,
    code,
    bgImage,
    profile_martin,
    uploadArea,
}


export const imagesDummyData = [pic1, pic2, pic3, pic4, pic1, pic2]

export const userDummyData = [
    {
        "_id": "680f50aaf10f3cd28382ecf2",
        "email": "test1@greatstack.dev",
        "fullName": "Alison Martin",
        "profilePic": profile_alison,
        "bio": "Hi Everyone, I am Using QuickChat",
    },
    {
        "_id": "680f50e4f10f3cd28382ecf9",
        "email": "test2@greatstack.dev",
        "fullName": "Martin Johnson",
        "profilePic": profile_martin,
        "bio": "Hi Everyone, I am Using QuickChat",
    },
    {
        "_id": "680f510af10f3cd28382ed01",
        "email": "test3@greatstack.dev",
        "fullName": "Enrique Martinez",
        "profilePic": profile_enrique,
        "bio": "Hi Everyone, I am Using QuickChat",
    },
    {
        "_id": "680f5137f10f3cd28382ed10",
        "email": "test4@greatstack.dev",
        "fullName": "Marco Jones",
        "profilePic": profile_marco,
        "bio": "Hi Everyone, I am Using QuickChat",
    },
    {
        "_id": "680f516cf10f3cd28382ed11",
        "email": "test5@greatstack.dev",
        "fullName": "Richard Smith",
        "profilePic": profile_richard,
        "bio": "Hi Everyone, I am Using QuickChat",
    }
]

export const messagesDummyData = [
    {
        "_id": "680f571ff10f3cd28382f094",
        "senderId": "680f5116f10f3cd28382ed02",
        "receiverId": "680f50e4f10f3cd28382ecf9",
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "seen": true,
        "createdAt": "2025-04-28T10:23:27.844Z",
    },
    {
        "_id": "680f5726f10f3cd28382f0b1",
        "senderId": "680f50e4f10f3cd28382ecf9",
        "receiverId": "680f5116f10f3cd28382ed02",
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "seen": true,
        "createdAt": "2025-04-28T10:23:34.520Z",
    },
    {
        "_id": "680f5729f10f3cd28382f0b6",
        "senderId": "680f5116f10f3cd28382ed02",
        "receiverId": "680f50e4f10f3cd28382ecf9",
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "seen": true,
        "createdAt": "2025-04-28T10:23:37.301Z",
    },
    {
        "_id": "680f572cf10f3cd28382f0bb",
        "senderId": "680f50e4f10f3cd28382ecf9",
        "receiverId": "680f5116f10f3cd28382ed02",
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "seen": true,
        "createdAt": "2025-04-28T10:23:40.334Z",
    },
    {
        "_id": "680f573cf10f3cd28382f0c0",
        "senderId": "680f50e4f10f3cd28382ecf9",
        "receiverId": "680f5116f10f3cd28382ed02",
        "image": img1,
        "seen": true,
        "createdAt": "2025-04-28T10:23:56.265Z",
    },
    {
        "_id": "680f5745f10f3cd28382f0c5",
        "senderId": "680f5116f10f3cd28382ed02",
        "receiverId": "680f50e4f10f3cd28382ecf9",
        "image": img2,
        "seen": true,
        "createdAt": "2025-04-28T10:24:05.164Z",
    },
    {
        "_id": "680f5748f10f3cd28382f0ca",
        "senderId": "680f5116f10f3cd28382ed02",
        "receiverId": "680f50e4f10f3cd28382ecf9",
        "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "seen": true,
        "createdAt": "2025-04-28T10:24:08.523Z",
    }
]
























export const summaryCards = [
  {
    title: "New Job Requests",
    count: 12,
    icon: FaClipboardList,
    bgColor: "bg-blue-500",
  },
  {
    title: "Active Services",
    count: 7,
    icon: FaCogs,
    bgColor: "bg-green-500",
  },
  {
    title: "Earnings",
    count: "$3,250",
    icon: FaDollarSign,
    bgColor: "bg-yellow-500",
  },
];

export const overviewServices = {
  completed: 8,
  cancelled: 3,
};

export const upcomingRequests = [
  {
    no: 1,
    service: "Plumbing",
    status: "Completed",
    payment: "Paid",
    location: "New York",
    date: "2025-10-05",
  },
  {
    no: 2,
    service: "Electrical",
    status: "Cancelled",
    payment: "Cash",
    location: "Los Angeles",
    date: "2025-10-06",
  },
  {
    no: 3,
    service: "Cleaning",
    status: "Pending",
    payment: "Not Paid",
    location: "Chicago",
    date: "2025-10-07",
  },
  {
    no: 4,
    service: "Cleaning",
    status: "Pending",
    payment: "Not Paid",
    location: "Chicago",
    date: "2025-10-07",
  },
  {
    no: 5,
    service: "Cleaning",
    status: "Pending",
    payment: "Not Paid",
    location: "Chicago",
    date: "2025-10-07",
  },
  {
    no: 6,
    service: "Cleaning",
    status: "Pending",
    payment: "Not Paid",
    location: "Chicago",
    date: "2025-10-07",
  },
  {
    no: 7,
    service: "Cleaning",
    status: "Pending",
    payment: "Not Paid",
    location: "Chicago",
    date: "2025-10-07",
  },
];

export const clients = [
  { id: 1, name: "John Doe", lastMessage: "Hello!" },
  { id: 2, name: "Jane Smith", lastMessage: "Are you available?" },
  { id: 3, name: "Mike Johnson", lastMessage: "Thanks for the info" },
];

export const messages = {
  1: [
    { from: "client", text: "Hi there!" },
    { from: "me", text: "Hello John, how can I help?" },
  ],
  2: [
    { from: "client", text: "Are you available today?" },
    { from: "me", text: "Yes, I am." },
  ],
  3: [
    { from: "client", text: "Thanks for the info." },
    { from: "me", text: "No problem!" },
  ],
};

export const categories = ["Plumbing", "Electrical", "Carpentry", "Cleaning"];

// Overview bar chart data
export const overviewBarData = [
  { status: "Completed", count: 95 },
  { status: "Cancelled", count: 25 },
];

// overviewMonthlyData.js
export const monthlyStatusData = [
  { month: "Jan", Completed: 10, Cancelled: 2 },
  { month: "Feb", Completed: 15, Cancelled: 5 },
  { month: "Mar", Completed: 20, Cancelled: 3 },
  { month: "Apr", Completed: 12, Cancelled: 4 },
  { month: "May", Completed: 18, Cancelled: 6 },
  { month: "Jun", Completed: 25, Cancelled: 5 },
  { month: "July", Completed: 25, Cancelled: 5 },
  { month: "Aug", Completed: 25, Cancelled: 5 },
  { month: "Sept", Completed: 25, Cancelled: 5 },
  { month: "Oct", Completed: 25, Cancelled: 5 },
  { month: "Nov", Completed: 25, Cancelled: 5 },
  { month: "Dec", Completed: 25, Cancelled: 5 },
];

export let services = [
  {
    id: 1,
    name: "Pipe Fixing",
    category: "Plumbing",
    status: "Active",
    amount: 50,
    dateAdded: "2025-10-03",
  },
  {
    id: 2,
    name: "Light Installation",
    category: "Electrical",
    status: "Inactive",
    amount: 80,
    dateAdded: "2025-10-02",
  },
  {
    id: 3,
    name: "Light Installation",
    category: "Electrical",
    status: "Inactive",
    amount: 80,
    dateAdded: "2025-10-02",
  },
  {
    id: 4,
    name: "Light Installation",
    category: "Electrical",
    status: "Inactive",
    amount: 80,
    dateAdded: "2025-10-02",
  },
  {
    id: 5,
    name: "Light Installation",
    category: "Electrical",
    status: "Inactive",
    amount: 80,
    dateAdded: "2025-10-02",
  },
  {
    id: 2,
    name: "Light Installation",
    category: "Electrical",
    status: "Inactive",
    amount: 80,
    dateAdded: "2025-10-02",
  },
  {
    id: 2,
    name: "Light Installation",
    category: "Electrical",
    status: "Inactive",
    amount: 80,
    dateAdded: "2025-10-02",
  },
];

export const earningsSummary = {
    totalEarnings: 1200,
    totalServicesCompleted: 15,
    pendingRequests: 3,
    paidOut: 1000,
};
  
export const earningServices = [
    { id: 1, name: "Pipe Fixing", people: 2, amountPerPerson: 50 },
    { id: 2, name: "Light Installation", people: 3, amountPerPerson: 80 },
    { id: 3, name: "Carpet Cleaning", people: 1, amountPerPerson: 40 },
    { id: 4, name: "Carpet Cleaning", people: 1, amountPerPerson: 40 },
    { id: 5, name: "Carpet Cleaning", people: 1, amountPerPerson: 40 },
    { id: 6, name: "Carpet Cleaning", people: 1, amountPerPerson: 40 },
    { id: 6, name: "Carpet Cleaning", people: 1, amountPerPerson: 40 },
    { id: 6, name: "Carpet Cleaning", people: 1, amountPerPerson: 40 },
    { id: 6, name: "Carpet Cleaning", people: 1, amountPerPerson: 40 },
    { id: 6, name: "Carpet Cleaning", people: 1, amountPerPerson: 40 },
    { id: 6, name: "Carpet Cleaning", people: 1, amountPerPerson: 40 },
];
  
export const totalRequests = 120;

export const newRequestsData = [
  { day: "Mon", requests: 5 },
  { day: "Tue", requests: 8 },
  { day: "Wed", requests: 12 },
  { day: "Thu", requests: 7 },
  { day: "Fri", requests: 10 },
  { day: "Sat", requests: 4 },
  { day: "Sun", requests: 9 },
];

export const categoryData = [
  { category: "Plumbing", requests: 40 },
  { category: "Electrician", requests: 30 },
  { category: "Cleaning", requests: 50 },
];

export const statusData = [
  { status: "Completed", requests: 60 },
  { status: "Pending", requests: 40 },
  { status: "Cancelled", requests: 20 },
];

export const dummyBookings = [
  {
    id: 1,
    service_name: "Pipe Fixing",
    category_name: "Plumbing",
    provider_name: "John Doe",
    service_image: "https://via.placeholder.com/80",
    amount: 50,
    is_paid: true,
    booking_date: "2025-10-01",
    service_date: "2025-10-05",
  },
  {
    id: 2,
    service_name: "Light Installation",
    category_name: "Electrical",
    provider_name: "Jane Smith",
    service_image: "https://via.placeholder.com/80",
    amount: 80,
    is_paid: false,
    booking_date: "2025-10-02",
    service_date: "2025-10-06",
  },
  {
    id: 3,
    service_name: "Carpet Cleaning",
    category_name: "Cleaning",
    provider_name: "Mike Johnson",
    service_image: "https://via.placeholder.com/80",
    amount: 40,
    is_paid: false,
    booking_date: "2025-10-03",
    service_date: "2025-10-07",
  },
];

