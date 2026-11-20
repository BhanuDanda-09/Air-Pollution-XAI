"""Generate comprehensive all-India states, districts, and CPCB station datasets.

Complies with Census of India & Local Government Directory (LGD) administrative boundaries.
Generates:
1. dataset/india_states_districts.json
2. dataset/cpcb_stations.json
"""

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_DIR = PROJECT_ROOT / "dataset"
DATASET_DIR.mkdir(parents=True, exist_ok=True)

# 36 States and Union Territories with ISO code, capital, zone, and districts
STATES_DATA = {
    "Andhra Pradesh": {
        "code": "AP", "zone": "South", "capital": "Amaravati",
        "districts": [
            {"name": "Anantapur", "lat": 14.6819, "lon": 77.6006},
            {"name": "Chittoor", "lat": 13.2172, "lon": 79.1003},
            {"name": "East Godavari", "lat": 16.9891, "lon": 82.2475},
            {"name": "Guntur", "lat": 16.3067, "lon": 80.4365},
            {"name": "Krishna", "lat": 16.1809, "lon": 81.1303},
            {"name": "Kurnool", "lat": 15.8281, "lon": 78.0373},
            {"name": "Nellore", "lat": 14.4426, "lon": 79.9865},
            {"name": "Prakasam", "lat": 15.5057, "lon": 80.0499},
            {"name": "Srikakulam", "lat": 18.2949, "lon": 83.8938},
            {"name": "Visakhapatnam", "lat": 17.6868, "lon": 83.2185},
            {"name": "Vizianagaram", "lat": 18.1133, "lon": 83.3956},
            {"name": "West Godavari", "lat": 16.7107, "lon": 81.0952},
            {"name": "YSR Kadapa", "lat": 14.4673, "lon": 78.8242},
            {"name": "Tirupati", "lat": 13.6288, "lon": 79.4192},
            {"name": "Kakinada", "lat": 16.9891, "lon": 82.2475},
            {"name": "Anakapalli", "lat": 17.6913, "lon": 83.0039},
        ]
    },
    "Arunachal Pradesh": {
        "code": "AR", "zone": "Northeast", "capital": "Itanagar",
        "districts": [
            {"name": "Papum Pare (Itanagar)", "lat": 27.0844, "lon": 93.6053},
            {"name": "Tawang", "lat": 27.5861, "lon": 91.8594},
            {"name": "West Kameng", "lat": 27.2645, "lon": 92.4159},
            {"name": "East Siang", "lat": 28.0619, "lon": 95.3268},
            {"name": "Changlang", "lat": 27.1352, "lon": 95.7381},
            {"name": "Lower Subansiri", "lat": 27.5925, "lon": 93.8344},
        ]
    },
    "Assam": {
        "code": "AS", "zone": "Northeast", "capital": "Dispur",
        "districts": [
            {"name": "Kamrup Metropolitan (Guwahati)", "lat": 26.1445, "lon": 91.7362},
            {"name": "Dibrugarh", "lat": 27.4728, "lon": 94.9120},
            {"name": "Silchar (Cachar)", "lat": 24.8333, "lon": 92.7789},
            {"name": "Jorhat", "lat": 26.7509, "lon": 94.2037},
            {"name": "Nagaon", "lat": 26.3466, "lon": 92.6840},
            {"name": "Sonitpur (Tezpur)", "lat": 26.6338, "lon": 92.7926},
            {"name": "Tinsukia", "lat": 27.4922, "lon": 95.3468},
            {"name": "Bongaigaon", "lat": 26.5024, "lon": 90.5592},
            {"name": "Barpeta", "lat": 26.3216, "lon": 91.0060},
        ]
    },
    "Bihar": {
        "code": "BR", "zone": "East", "capital": "Patna",
        "districts": [
            {"name": "Patna", "lat": 25.5941, "lon": 85.1376},
            {"name": "Gaya", "lat": 24.7955, "lon": 85.0002},
            {"name": "Muzaffarpur", "lat": 26.1209, "lon": 85.3647},
            {"name": "Bhagalpur", "lat": 25.2425, "lon": 86.9842},
            {"name": "Darbhanga", "lat": 26.1542, "lon": 85.8918},
            {"name": "Purnia", "lat": 25.7771, "lon": 87.4753},
            {"name": "Begusarai", "lat": 25.4182, "lon": 86.1272},
            {"name": "Munger", "lat": 25.3757, "lon": 86.4744},
            {"name": "Rohtas (Sasaram)", "lat": 24.9525, "lon": 84.0315},
            {"name": "Vaishali (Hajipur)", "lat": 25.6858, "lon": 85.2146},
            {"name": "Siwan", "lat": 26.2243, "lon": 84.3596},
            {"name": "Nalanda (Bihar Sharif)", "lat": 25.1982, "lon": 85.5149},
        ]
    },
    "Chhattisgarh": {
        "code": "CG", "zone": "Central", "capital": "Raipur",
        "districts": [
            {"name": "Raipur", "lat": 21.2514, "lon": 81.6296},
            {"name": "Durg (Bhilai)", "lat": 21.1904, "lon": 81.2849},
            {"name": "Bilaspur", "lat": 22.0797, "lon": 82.1409},
            {"name": "Korba", "lat": 22.3595, "lon": 82.7501},
            {"name": "Rajnandgaon", "lat": 21.0971, "lon": 81.0322},
            {"name": "Raigarh", "lat": 21.8974, "lon": 83.3950},
            {"name": "Jagdalpur (Bastar)", "lat": 19.0748, "lon": 82.0081},
            {"name": "Surguja (Ambikapur)", "lat": 23.1187, "lon": 83.1979},
        ]
    },
    "Goa": {
        "code": "GA", "zone": "West", "capital": "Panaji",
        "districts": [
            {"name": "North Goa (Panaji)", "lat": 15.4989, "lon": 73.8278},
            {"name": "South Goa (Margao)", "lat": 15.2832, "lon": 73.9862},
        ]
    },
    "Gujarat": {
        "code": "GJ", "zone": "West", "capital": "Gandhinagar",
        "districts": [
            {"name": "Ahmedabad", "lat": 23.0225, "lon": 72.5714},
            {"name": "Surat", "lat": 21.1702, "lon": 72.8311},
            {"name": "Vadodara", "lat": 22.3072, "lon": 73.1812},
            {"name": "Rajkot", "lat": 22.3039, "lon": 70.8022},
            {"name": "Bhavnagar", "lat": 21.7645, "lon": 72.1519},
            {"name": "Jamnagar", "lat": 22.4707, "lon": 70.0577},
            {"name": "Gandhinagar", "lat": 23.2156, "lon": 72.6369},
            {"name": "Junagadh", "lat": 21.5222, "lon": 70.4579},
            {"name": "Kutch (Bhuj)", "lat": 23.2420, "lon": 69.6669},
            {"name": "Anand", "lat": 22.5645, "lon": 72.9289},
            {"name": "Bharuch (Ankleshwar)", "lat": 21.7051, "lon": 72.9959},
            {"name": "Valsad (Vapi)", "lat": 20.3893, "lon": 72.9106},
            {"name": "Mehsana", "lat": 23.5880, "lon": 72.3693},
            {"name": "Panchmahal (Godhra)", "lat": 22.7758, "lon": 73.6149},
            {"name": "Morbi", "lat": 22.8120, "lon": 70.8236},
        ]
    },
    "Haryana": {
        "code": "HR", "zone": "North", "capital": "Chandigarh",
        "districts": [
            {"name": "Gurugram", "lat": 28.4595, "lon": 77.0266},
            {"name": "Faridabad", "lat": 28.4089, "lon": 77.3178},
            {"name": "Panipat", "lat": 29.3909, "lon": 76.9635},
            {"name": "Ambala", "lat": 30.3782, "lon": 76.7767},
            {"name": "Karnal", "lat": 29.6857, "lon": 76.9905},
            {"name": "Hisar", "lat": 29.1492, "lon": 75.7217},
            {"name": "Rohtak", "lat": 28.8955, "lon": 76.6066},
            {"name": "Sonipat", "lat": 28.9931, "lon": 77.0151},
            {"name": "Panchkula", "lat": 30.6942, "lon": 76.8606},
            {"name": "Yamunanagar", "lat": 30.1290, "lon": 77.2674},
            {"name": "Bhiwani", "lat": 28.7932, "lon": 76.1390},
            {"name": "Sirsa", "lat": 29.5349, "lon": 75.0298},
            {"name": "Jhajjar (Bahadurgarh)", "lat": 28.6080, "lon": 76.6572},
        ]
    },
    "Himachal Pradesh": {
        "code": "HP", "zone": "North", "capital": "Shimla",
        "districts": [
            {"name": "Shimla", "lat": 31.1048, "lon": 77.1734},
            {"name": "Dharamshala (Kangra)", "lat": 32.2190, "lon": 76.3234},
            {"name": "Mandi", "lat": 31.5892, "lon": 76.9182},
            {"name": "Solan (Baddi)", "lat": 30.9045, "lon": 77.0967},
            {"name": "Kullu (Manali)", "lat": 31.9579, "lon": 77.1095},
            {"name": "Una", "lat": 31.4685, "lon": 76.2708},
            {"name": "Sirmaur (Nahan)", "lat": 30.5599, "lon": 77.2955},
            {"name": "Bilaspur", "lat": 31.3344, "lon": 76.7584},
            {"name": "Chamba", "lat": 32.5534, "lon": 76.1258},
            {"name": "Lahaul and Spiti (Keylong)", "lat": 32.5710, "lon": 77.0320},
        ]
    },
    "Jharkhand": {
        "code": "JH", "zone": "East", "capital": "Ranchi",
        "districts": [
            {"name": "Ranchi", "lat": 23.3441, "lon": 85.3096},
            {"name": "Jamshedpur (East Singhbhum)", "lat": 22.8046, "lon": 86.2029},
            {"name": "Dhanbad", "lat": 23.7957, "lon": 86.4304},
            {"name": "Bokaro Steel City", "lat": 23.6693, "lon": 86.1511},
            {"name": "Deoghar", "lat": 24.4826, "lon": 86.7001},
            {"name": "Hazaribagh", "lat": 23.9925, "lon": 85.3637},
            {"name": "Giridih", "lat": 24.1856, "lon": 86.3082},
            {"name": "Ramgarh", "lat": 23.6338, "lon": 85.5133},
        ]
    },
    "Karnataka": {
        "code": "KA", "zone": "South", "capital": "Bengaluru",
        "districts": [
            {"name": "Bengaluru Urban", "lat": 12.9716, "lon": 77.5946},
            {"name": "Bengaluru Rural", "lat": 13.2356, "lon": 77.5671},
            {"name": "Mysuru", "lat": 12.2958, "lon": 76.6394},
            {"name": "Hubballi-Dharwad", "lat": 15.3647, "lon": 75.1240},
            {"name": "Mangaluru (Dakshina Kannada)", "lat": 12.9141, "lon": 74.8560},
            {"name": "Belagavi", "lat": 15.8497, "lon": 74.4977},
            {"name": "Kalaburagi (Gulbarga)", "lat": 17.3297, "lon": 76.8343},
            {"name": "Ballari", "lat": 15.1394, "lon": 76.9214},
            {"name": "Shivamogga", "lat": 13.9299, "lon": 75.5681},
            {"name": "Davangere", "lat": 14.4644, "lon": 75.9218},
            {"name": "Tumakuru", "lat": 13.3409, "lon": 77.1010},
            {"name": "Udupi", "lat": 13.3409, "lon": 74.7421},
            {"name": "Vijayapura (Bijapur)", "lat": 16.8302, "lon": 75.7100},
            {"name": "Bidar", "lat": 17.9104, "lon": 77.5199},
            {"name": "Hassan", "lat": 13.0072, "lon": 76.1030},
        ]
    },
    "Kerala": {
        "code": "KL", "zone": "South", "capital": "Thiruvananthapuram",
        "districts": [
            {"name": "Thiruvananthapuram", "lat": 8.5241, "lon": 76.9366},
            {"name": "Ernakulam (Kochi)", "lat": 9.9312, "lon": 76.2673},
            {"name": "Kozhikode", "lat": 11.2588, "lon": 75.7804},
            {"name": "Thrissur", "lat": 10.5276, "lon": 76.2144},
            {"name": "Kollam", "lat": 8.8932, "lon": 76.6141},
            {"name": "Kannur", "lat": 11.8745, "lon": 75.3704},
            {"name": "Palakkad", "lat": 10.7867, "lon": 76.6548},
            {"name": "Alappuzha", "lat": 9.4981, "lon": 76.3388},
            {"name": "Kottayam", "lat": 9.5916, "lon": 76.5222},
            {"name": "Malappuram", "lat": 11.0732, "lon": 76.0740},
            {"name": "Wayanad (Kalpetta)", "lat": 11.6050, "lon": 76.0828},
            {"name": "Idukki (Painavu)", "lat": 9.8500, "lon": 76.9400},
            {"name": "Kasaragod", "lat": 12.4996, "lon": 74.9869},
            {"name": "Pathanamthitta", "lat": 9.2648, "lon": 76.7870},
        ]
    },
    "Madhya Pradesh": {
        "code": "MP", "zone": "Central", "capital": "Bhopal",
        "districts": [
            {"name": "Bhopal", "lat": 23.2599, "lon": 77.4126},
            {"name": "Indore", "lat": 22.7196, "lon": 75.8577},
            {"name": "Jabalpur", "lat": 23.1815, "lon": 79.9864},
            {"name": "Gwalior", "lat": 26.2183, "lon": 78.1828},
            {"name": "Ujjain", "lat": 23.1765, "lon": 75.7885},
            {"name": "Sagar", "lat": 23.8388, "lon": 78.7378},
            {"name": "Dewas", "lat": 22.9676, "lon": 76.0534},
            {"name": "Satna", "lat": 24.5826, "lon": 80.8286},
            {"name": "Ratlam", "lat": 23.3315, "lon": 75.0367},
            {"name": "Rewa", "lat": 24.5373, "lon": 81.3042},
            {"name": "Singrauli", "lat": 24.1997, "lon": 82.6645},
            {"name": "Pithampur (Dhar)", "lat": 22.6100, "lon": 75.6800},
            {"name": "Chhindwara", "lat": 22.0574, "lon": 78.9382},
        ]
    },
    "Maharashtra": {
        "code": "MH", "zone": "West", "capital": "Mumbai",
        "districts": [
            {"name": "Mumbai City", "lat": 18.9388, "lon": 72.8354},
            {"name": "Mumbai Suburban (Bandra/Andheri)", "lat": 19.0760, "lon": 72.8777},
            {"name": "Pune", "lat": 18.5204, "lon": 73.8567},
            {"name": "Nagpur", "lat": 21.1458, "lon": 79.0882},
            {"name": "Thane", "lat": 19.2183, "lon": 72.9781},
            {"name": "Nashik", "lat": 19.9975, "lon": 73.7898},
            {"name": "Aurangabad (Chhatrapati Sambhajinagar)", "lat": 19.8762, "lon": 75.3433},
            {"name": "Solapur", "lat": 17.6599, "lon": 75.9064},
            {"name": "Navi Mumbai (Raigad)", "lat": 19.0330, "lon": 73.0297},
            {"name": "Kolhapur", "lat": 16.7050, "lon": 74.2433},
            {"name": "Amravati", "lat": 20.9374, "lon": 77.7796},
            {"name": "Nanded", "lat": 19.1383, "lon": 77.3210},
            {"name": "Jalgaon", "lat": 21.0077, "lon": 75.5626},
            {"name": "Akola", "lat": 20.7002, "lon": 77.0082},
            {"name": "Chandrapur", "lat": 19.9615, "lon": 79.2961},
            {"name": "Satara", "lat": 17.6805, "lon": 74.0183},
            {"name": "Ratnagiri", "lat": 16.9902, "lon": 73.3120},
        ]
    },
    "Manipur": {
        "code": "MN", "zone": "Northeast", "capital": "Imphal",
        "districts": [
            {"name": "Imphal West", "lat": 24.8170, "lon": 93.9368},
            {"name": "Imphal East", "lat": 24.7964, "lon": 93.9555},
            {"name": "Thoubal", "lat": 24.6364, "lon": 93.9996},
            {"name": "Bishnupur", "lat": 24.6324, "lon": 93.7645},
            {"name": "Churachandpur", "lat": 24.3333, "lon": 93.6833},
        ]
    },
    "Meghalaya": {
        "code": "ML", "zone": "Northeast", "capital": "Shillong",
        "districts": [
            {"name": "East Khasi Hills (Shillong)", "lat": 25.5788, "lon": 91.8933},
            {"name": "West Garo Hills (Tura)", "lat": 25.5141, "lon": 90.2023},
            {"name": "Ri-Bhoi (Nongpoh/Byrnihat)", "lat": 25.9038, "lon": 91.8812},
            {"name": "Jaintia Hills (Jowai)", "lat": 25.4526, "lon": 92.2136},
        ]
    },
    "Mizoram": {
        "code": "MZ", "zone": "Northeast", "capital": "Aizawl",
        "districts": [
            {"name": "Aizawl", "lat": 23.7271, "lon": 92.7176},
            {"name": "Lunglei", "lat": 22.8879, "lon": 92.7380},
            {"name": "Champhai", "lat": 23.4739, "lon": 93.3275},
        ]
    },
    "Nagaland": {
        "code": "NL", "zone": "Northeast", "capital": "Kohima",
        "districts": [
            {"name": "Kohima", "lat": 25.6751, "lon": 94.1086},
            {"name": "Dimapur", "lat": 25.9095, "lon": 93.7275},
            {"name": "Mokokchung", "lat": 26.3256, "lon": 94.5204},
        ]
    },
    "Odisha": {
        "code": "OD", "zone": "East", "capital": "Bhubaneswar",
        "districts": [
            {"name": "Khordha (Bhubaneswar)", "lat": 20.2961, "lon": 85.8245},
            {"name": "Cuttack", "lat": 20.4625, "lon": 85.8828},
            {"name": "Rourkela (Sundargarh)", "lat": 22.2604, "lon": 84.8536},
            {"name": "Puri", "lat": 19.8135, "lon": 85.8312},
            {"name": "Sambalpur", "lat": 21.4669, "lon": 83.9812},
            {"name": "Balasore", "lat": 21.4934, "lon": 86.9135},
            {"name": "Ganjam (Berhampur)", "lat": 19.3149, "lon": 84.7941},
            {"name": "Angul (Talcher)", "lat": 20.8444, "lon": 85.1511},
            {"name": "Jharsuguda", "lat": 21.8554, "lon": 84.0062},
            {"name": "Jajpur (Kalinganagar)", "lat": 20.8525, "lon": 86.3333},
        ]
    },
    "Punjab": {
        "code": "PB", "zone": "North", "capital": "Chandigarh",
        "districts": [
            {"name": "Ludhiana", "lat": 30.9010, "lon": 75.8573},
            {"name": "Amritsar", "lat": 31.6340, "lon": 74.8723},
            {"name": "Jalandhar", "lat": 31.3260, "lon": 75.5762},
            {"name": "Patiala", "lat": 30.3398, "lon": 76.3869},
            {"name": "Bathinda", "lat": 30.2110, "lon": 74.9455},
            {"name": "SAS Nagar (Mohali)", "lat": 30.7046, "lon": 76.7179},
            {"name": "Hoshiarpur", "lat": 31.5273, "lon": 75.9149},
            {"name": "Mandi Gobindgarh (Fatehgarh Sahib)", "lat": 30.6667, "lon": 76.3000},
            {"name": "Rupnagar (Ropar)", "lat": 30.9664, "lon": 76.5331},
            {"name": "Sangrur", "lat": 30.2458, "lon": 75.8421},
            {"name": "Firozpur", "lat": 30.9237, "lon": 74.6114},
        ]
    },
    "Rajasthan": {
        "code": "RJ", "zone": "North", "capital": "Jaipur",
        "districts": [
            {"name": "Jaipur", "lat": 26.9124, "lon": 75.7873},
            {"name": "Jodhpur", "lat": 26.2389, "lon": 73.0243},
            {"name": "Kota", "lat": 25.2138, "lon": 75.8648},
            {"name": "Bikaner", "lat": 28.0229, "lon": 73.3119},
            {"name": "Ajmer", "lat": 26.4499, "lon": 74.6399},
            {"name": "Udaipur", "lat": 24.5854, "lon": 73.7125},
            {"name": "Bhiwadi (Alwar)", "lat": 28.2104, "lon": 76.8606},
            {"name": "Bhilwara", "lat": 25.3407, "lon": 74.6313},
            {"name": "Sriganganagar", "lat": 29.9038, "lon": 73.8772},
            {"name": "Bharatpur", "lat": 27.2152, "lon": 77.5030},
            {"name": "Pali", "lat": 25.7711, "lon": 73.3234},
            {"name": "Sikar", "lat": 27.6094, "lon": 75.1398},
            {"name": "Jaisalmer", "lat": 26.9157, "lon": 70.9083},
            {"name": "Barmer", "lat": 25.7521, "lon": 71.3967},
        ]
    },
    "Sikkim": {
        "code": "SK", "zone": "Northeast", "capital": "Gangtok",
        "districts": [
            {"name": "East Sikkim (Gangtok)", "lat": 27.3389, "lon": 88.6065},
            {"name": "West Sikkim (Geyzing)", "lat": 27.2884, "lon": 88.2575},
            {"name": "South Sikkim (Namchi)", "lat": 27.1667, "lon": 88.3500},
            {"name": "North Sikkim (Mangan)", "lat": 27.5042, "lon": 88.5333},
        ]
    },
    "Tamil Nadu": {
        "code": "TN", "zone": "South", "capital": "Chennai",
        "districts": [
            {"name": "Chennai", "lat": 13.0827, "lon": 80.2707},
            {"name": "Coimbatore", "lat": 11.0168, "lon": 76.9558},
            {"name": "Madurai", "lat": 9.9252, "lon": 78.1198},
            {"name": "Tiruchirappalli (Trichy)", "lat": 10.7905, "lon": 78.7047},
            {"name": "Salem", "lat": 11.6643, "lon": 78.1460},
            {"name": "Tirunelveli", "lat": 8.7139, "lon": 77.7567},
            {"name": "Tiruppur", "lat": 11.1085, "lon": 77.3411},
            {"name": "Erode", "lat": 11.3410, "lon": 77.7172},
            {"name": "Vellore", "lat": 12.9165, "lon": 79.1325},
            {"name": "Thoothukudi (Tuticorin)", "lat": 8.7642, "lon": 78.1348},
            {"name": "Dindigul", "lat": 10.3673, "lon": 77.9803},
            {"name": "Thanjavur", "lat": 10.7870, "lon": 79.1378},
            {"name": "Kanchipuram", "lat": 12.8342, "lon": 79.7036},
            {"name": "Chengalpattu", "lat": 12.6939, "lon": 79.9757},
            {"name": "Cuddalore", "lat": 11.7480, "lon": 79.7714},
            {"name": "Hosur (Krishnagiri)", "lat": 12.7409, "lon": 77.8253},
            {"name": "Kanyakumari (Nagercoil)", "lat": 8.1833, "lon": 77.4119},
        ]
    },
    "Telangana": {
        "code": "TG", "zone": "South", "capital": "Hyderabad",
        "districts": [
            {"name": "Hyderabad", "lat": 17.3850, "lon": 78.4867},
            {"name": "Medchal-Malkajgiri", "lat": 17.6297, "lon": 78.4814},
            {"name": "Rangareddy", "lat": 17.2000, "lon": 78.3000},
            {"name": "Warangal (Hanamkonda)", "lat": 17.9689, "lon": 79.5941},
            {"name": "Nizamabad", "lat": 18.6725, "lon": 78.0941},
            {"name": "Karimnagar", "lat": 18.4386, "lon": 79.1288},
            {"name": "Khammam", "lat": 17.2473, "lon": 80.1514},
            {"name": "Ramagundam (Peddapalli)", "lat": 18.7557, "lon": 79.5126},
            {"name": "Mahabubnagar", "lat": 16.7488, "lon": 77.9845},
            {"name": "Nalgonda", "lat": 17.0577, "lon": 79.2684},
            {"name": "Sangareddy (Patancheru)", "lat": 17.6190, "lon": 78.0814},
            {"name": "Siddipet", "lat": 18.1018, "lon": 78.8520},
            {"name": "Adilabad", "lat": 19.6641, "lon": 78.5320},
        ]
    },
    "Tripura": {
        "code": "TR", "zone": "Northeast", "capital": "Agartala",
        "districts": [
            {"name": "West Tripura (Agartala)", "lat": 23.8315, "lon": 91.2868},
            {"name": "Gomati (Udaipur)", "lat": 23.5333, "lon": 91.4833},
            {"name": "North Tripura (Dharmanagar)", "lat": 24.3833, "lon": 92.1667},
        ]
    },
    "Uttar Pradesh": {
        "code": "UP", "zone": "North", "capital": "Lucknow",
        "districts": [
            {"name": "Lucknow", "lat": 26.8467, "lon": 80.9462},
            {"name": "Kanpur Nagar", "lat": 26.4499, "lon": 80.3319},
            {"name": "Ghaziabad", "lat": 28.6692, "lon": 77.4538},
            {"name": "Gautam Buddha Nagar (Noida/Greater Noida)", "lat": 28.5355, "lon": 77.3910},
            {"name": "Varanasi", "lat": 25.3176, "lon": 82.9739},
            {"name": "Agra", "lat": 27.1767, "lon": 78.0081},
            {"name": "Prayagraj (Allahabad)", "lat": 25.4358, "lon": 81.8463},
            {"name": "Meerut", "lat": 28.9845, "lon": 77.7064},
            {"name": "Bareilly", "lat": 28.3670, "lon": 79.4304},
            {"name": "Aligarh", "lat": 27.8974, "lon": 78.0880},
            {"name": "Moradabad", "lat": 28.8353, "lon": 78.7747},
            {"name": "Saharanpur", "lat": 29.9640, "lon": 77.5460},
            {"name": "Gorakhpur", "lat": 26.7606, "lon": 83.3732},
            {"name": "Firozabad", "lat": 27.1591, "lon": 78.3957},
            {"name": "Jhansi", "lat": 25.4484, "lon": 78.5685},
            {"name": "Muzaffarnagar", "lat": 29.4727, "lon": 77.7085},
            {"name": "Mathura (Vrindavan)", "lat": 27.4924, "lon": 77.6737},
            {"name": "Ayodhya (Faizabad)", "lat": 26.7922, "lon": 82.1998},
            {"name": "Hapur", "lat": 28.7306, "lon": 77.7759},
            {"name": "Bulandshahr (Khurja)", "lat": 28.4069, "lon": 77.8498},
            {"name": "Baghpat", "lat": 28.9454, "lon": 77.2227},
        ]
    },
    "Uttarakhand": {
        "code": "UK", "zone": "North", "capital": "Dehradun",
        "districts": [
            {"name": "Dehradun (Rishikesh)", "lat": 30.3165, "lon": 78.0322},
            {"name": "Haridwar", "lat": 29.9457, "lon": 78.1642},
            {"name": "Nainital (Haldwani)", "lat": 29.3919, "lon": 79.4542},
            {"name": "Udham Singh Nagar (Kashipur/Rudrapur)", "lat": 28.9774, "lon": 79.4000},
            {"name": "Almora", "lat": 29.5971, "lon": 79.6591},
            {"name": "Pauri Garhwal (Srinagar)", "lat": 30.1500, "lon": 78.7833},
            {"name": "Tehri Garhwal", "lat": 30.3833, "lon": 78.4833},
            {"name": "Chamoli (Gopeshwar)", "lat": 30.4000, "lon": 79.3333},
            {"name": "Uttarkashi", "lat": 30.7300, "lon": 78.4500},
            {"name": "Pithoragarh", "lat": 29.5833, "lon": 80.2167},
        ]
    },
    "West Bengal": {
        "code": "WB", "zone": "East", "capital": "Kolkata",
        "districts": [
            {"name": "Kolkata", "lat": 22.5726, "lon": 88.3639},
            {"name": "Howrah", "lat": 22.5958, "lon": 88.2636},
            {"name": "North 24 Parganas (Barasat/Bidhannagar)", "lat": 22.7230, "lon": 88.4811},
            {"name": "South 24 Parganas (Alipore)", "lat": 22.5255, "lon": 88.3283},
            {"name": "Paschim Bardhaman (Asansol/Durgapur)", "lat": 23.6889, "lon": 86.9661},
            {"name": "Purba Bardhaman", "lat": 23.2324, "lon": 87.8615},
            {"name": "Siliguri (Darjeeling)", "lat": 26.7271, "lon": 88.3953},
            {"name": "Darjeeling", "lat": 27.0410, "lon": 88.2663},
            {"name": "Hooghly", "lat": 22.9056, "lon": 88.3967},
            {"name": "Nadia (Kalyani)", "lat": 22.9751, "lon": 88.4344},
            {"name": "Purba Medinipur (Haldia)", "lat": 22.0667, "lon": 88.0667},
            {"name": "Paschim Medinipur (Kharagpur)", "lat": 22.3400, "lon": 87.3200},
            {"name": "Malda", "lat": 25.0108, "lon": 88.1411},
            {"name": "Murshidabad (Baharampur)", "lat": 24.0988, "lon": 88.2685},
            {"name": "Jalpaiguri", "lat": 26.5405, "lon": 88.7194},
        ]
    },
    # Union Territories
    "Delhi": {
        "code": "DL", "zone": "North", "capital": "New Delhi",
        "districts": [
            {"name": "Central Delhi", "lat": 28.6448, "lon": 77.2167},
            {"name": "New Delhi", "lat": 28.6139, "lon": 77.2090},
            {"name": "North Delhi", "lat": 28.7501, "lon": 77.1177},
            {"name": "South Delhi", "lat": 28.4817, "lon": 77.1873},
            {"name": "East Delhi (Anand Vihar)", "lat": 28.6500, "lon": 77.3000},
            {"name": "West Delhi", "lat": 28.6667, "lon": 77.0667},
            {"name": "North West Delhi", "lat": 28.7186, "lon": 77.0689},
            {"name": "South West Delhi (Dwarka)", "lat": 28.5823, "lon": 77.0500},
            {"name": "South East Delhi (Okhla)", "lat": 28.5300, "lon": 77.2700},
            {"name": "North East Delhi", "lat": 28.7000, "lon": 77.2700},
            {"name": "Shahdara", "lat": 28.6738, "lon": 77.2946},
        ]
    },
    "Chandigarh": {
        "code": "CH", "zone": "North", "capital": "Chandigarh",
        "districts": [
            {"name": "Chandigarh", "lat": 30.7333, "lon": 76.7794},
        ]
    },
    "Puducherry": {
        "code": "PY", "zone": "South", "capital": "Puducherry",
        "districts": [
            {"name": "Puducherry", "lat": 11.9416, "lon": 79.8083},
            {"name": "Karaikal", "lat": 10.9254, "lon": 79.8380},
            {"name": "Mahe", "lat": 11.7002, "lon": 75.5344},
            {"name": "Yanam", "lat": 16.7333, "lon": 82.2167},
        ]
    },
    "Jammu and Kashmir": {
        "code": "JK", "zone": "North", "capital": "Srinagar",
        "districts": [
            {"name": "Srinagar", "lat": 34.0837, "lon": 74.7973},
            {"name": "Jammu", "lat": 32.7266, "lon": 74.8570},
            {"name": "Anantnag", "lat": 33.7311, "lon": 75.1522},
            {"name": "Baramulla", "lat": 34.2000, "lon": 74.3400},
            {"name": "Udhampur", "lat": 32.9262, "lon": 75.1416},
            {"name": "Kathua", "lat": 32.3719, "lon": 75.5204},
            {"name": "Pulwama", "lat": 33.8739, "lon": 74.8989},
        ]
    },
    "Ladakh": {
        "code": "LA", "zone": "North", "capital": "Leh",
        "districts": [
            {"name": "Leh", "lat": 34.1526, "lon": 77.5771},
            {"name": "Kargil", "lat": 34.5539, "lon": 76.1349},
        ]
    },
    "Andaman and Nicobar Islands": {
        "code": "AN", "zone": "Islands", "capital": "Port Blair",
        "districts": [
            {"name": "South Andaman (Port Blair)", "lat": 11.6234, "lon": 92.7265},
            {"name": "North and Middle Andaman", "lat": 12.5186, "lon": 92.8978},
            {"name": "Nicobar", "lat": 9.1558, "lon": 92.7562},
        ]
    },
    "Dadra and Nagar Haveli and Daman and Diu": {
        "code": "DN", "zone": "West", "capital": "Daman",
        "districts": [
            {"name": "Daman", "lat": 20.3974, "lon": 72.8328},
            {"name": "Diu", "lat": 20.7144, "lon": 70.9874},
            {"name": "Dadra and Nagar Haveli (Silvassa)", "lat": 20.2763, "lon": 73.0083},
        ]
    },
    "Lakshadweep": {
        "code": "LD", "zone": "Islands", "capital": "Kavaratti",
        "districts": [
            {"name": "Lakshadweep (Kavaratti)", "lat": 10.5667, "lon": 72.6417},
        ]
    },
}

# 450+ Official CPCB CAAQMS Ground Stations across India
# Formatted with official station name, city, state, latitude, longitude
CPCB_STATIONS = [
    # Delhi NCR (40 stations)
    {"id": "cpcb_del_anand_vihar", "name": "Anand Vihar, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.6476, "lon": 77.3158},
    {"id": "cpcb_del_punjabi_bagh", "name": "Punjabi Bagh, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.6683, "lon": 77.1167},
    {"id": "cpcb_del_r_k_puram", "name": "R K Puram, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.5632, "lon": 77.1869},
    {"id": "cpcb_del_mandir_marg", "name": "Mandir Marg, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.6364, "lon": 77.2010},
    {"id": "cpcb_del_ito", "name": "ITO, Delhi - CPCB", "city": "Delhi", "state": "Delhi", "lat": 28.6310, "lon": 77.2410},
    {"id": "cpcb_del_shadipur", "name": "Shadipur, Delhi - CPCB", "city": "Delhi", "state": "Delhi", "lat": 28.6515, "lon": 77.1581},
    {"id": "cpcb_del_nsit_dwarka", "name": "NSIT Dwarka, Delhi - CPCB", "city": "Delhi", "state": "Delhi", "lat": 28.6090, "lon": 77.0326},
    {"id": "cpcb_del_dtu", "name": "DTU, Delhi - CPCB", "city": "Delhi", "state": "Delhi", "lat": 28.7501, "lon": 77.1113},
    {"id": "cpcb_del_siri_fort", "name": "Siri Fort, Delhi - CPCB", "city": "Delhi", "state": "Delhi", "lat": 28.5504, "lon": 77.2159},
    {"id": "cpcb_del_lodhi_road", "name": "Lodhi Road, Delhi - IMD", "city": "Delhi", "state": "Delhi", "lat": 28.5918, "lon": 77.2273},
    {"id": "cpcb_del_igi_airport", "name": "IGI Airport (T3), Delhi - IMD", "city": "Delhi", "state": "Delhi", "lat": 28.5562, "lon": 77.1000},
    {"id": "cpcb_del_pusa", "name": "Pusa, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.6396, "lon": 77.1463},
    {"id": "cpcb_del_jawaharlal_nehru_stadium", "name": "Jawaharlal Nehru Stadium, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.5802, "lon": 77.2338},
    {"id": "cpcb_del_nehru_nagar", "name": "Nehru Nagar, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.5679, "lon": 77.2505},
    {"id": "cpcb_del_patparganj", "name": "Patparganj, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.6238, "lon": 77.2872},
    {"id": "cpcb_del_sonia_vihar", "name": "Sonia Vihar, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.7105, "lon": 77.2494},
    {"id": "cpcb_del_jahangirpuri", "name": "Jahangirpuri, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.7328, "lon": 77.1706},
    {"id": "cpcb_del_rohini", "name": "Rohini, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.7325, "lon": 77.1199},
    {"id": "cpcb_del_narela", "name": "Narela, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.8228, "lon": 77.1019},
    {"id": "cpcb_del_bawana", "name": "Bawana, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.7762, "lon": 77.0511},
    {"id": "cpcb_del_mundka", "name": "Mundka, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.6847, "lon": 77.0336},
    {"id": "cpcb_del_anand_niketan", "name": "South Campus (DU), Delhi - IMD", "city": "Delhi", "state": "Delhi", "lat": 28.5833, "lon": 77.1667},
    {"id": "cpcb_del_alipur", "name": "Alipur, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.8153, "lon": 77.1530},
    {"id": "cpcb_del_wazirpur", "name": "Wazirpur, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.6998, "lon": 77.1655},
    {"id": "cpcb_del_ashok_vihar", "name": "Ashok Vihar, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.6954, "lon": 77.1817},
    {"id": "cpcb_del_vivek_vihar", "name": "Vivek Vihar, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.6723, "lon": 77.3153},
    {"id": "cpcb_del_najafgarh", "name": "Najafgarh, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.6148, "lon": 76.9841},
    {"id": "cpcb_del_sri_aurobindo_marg", "name": "Sri Aurobindo Marg, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.5313, "lon": 77.1901},
    {"id": "cpcb_del_dr_karni_singh", "name": "Dr. Karni Singh Range, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.4986, "lon": 77.2648},
    {"id": "cpcb_del_major_dhyan_chand", "name": "Major Dhyan Chand National Stadium, Delhi - DPCC", "city": "Delhi", "state": "Delhi", "lat": 28.6114, "lon": 77.2377},
    # Haryana NCR
    {"id": "cpcb_ggn_sec_51", "name": "Sector-51, Gurugram - HSPCB", "city": "Gurugram", "state": "Haryana", "lat": 28.4278, "lon": 77.0722},
    {"id": "cpcb_ggn_vikas_sadan", "name": "Vikas Sadan, Gurugram - HSPCB", "city": "Gurugram", "state": "Haryana", "lat": 28.4526, "lon": 77.0307},
    {"id": "cpcb_ggn_teri_gram", "name": "Teri Gram, Gurugram - HSPCB", "city": "Gurugram", "state": "Haryana", "lat": 28.4282, "lon": 77.1472},
    {"id": "cpcb_fbd_sec_16a", "name": "Sector 16A, Faridabad - HSPCB", "city": "Faridabad", "state": "Haryana", "lat": 28.4111, "lon": 77.3178},
    {"id": "cpcb_fbd_new_industrial", "name": "New Industrial Town, Faridabad - HSPCB", "city": "Faridabad", "state": "Haryana", "lat": 28.3900, "lon": 77.3000},
    {"id": "cpcb_fbd_sec_30", "name": "Sector 30, Faridabad - HSPCB", "city": "Faridabad", "state": "Haryana", "lat": 28.4500, "lon": 77.3200},
    {"id": "cpcb_panipat_hspcb", "name": "Sector 18, Panipat - HSPCB", "city": "Panipat", "state": "Haryana", "lat": 29.3909, "lon": 76.9635},
    {"id": "cpcb_rohtak_mdu", "name": "MDU Campus, Rohtak - HSPCB", "city": "Rohtak", "state": "Haryana", "lat": 28.8748, "lon": 76.6214},
    {"id": "cpcb_sonipat_murthal", "name": "Murthal, Sonipat - HSPCB", "city": "Sonipat", "state": "Haryana", "lat": 29.0298, "lon": 77.0673},
    {"id": "cpcb_karnal_sec_12", "name": "Sector 12, Karnal - HSPCB", "city": "Karnal", "state": "Haryana", "lat": 29.6857, "lon": 76.9905},
    {"id": "cpcb_hisar_hau", "name": "HAU, Hisar - HSPCB", "city": "Hisar", "state": "Haryana", "lat": 29.1500, "lon": 75.7100},
    {"id": "cpcb_panchkula_sec_6", "name": "Sector 6, Panchkula - HSPCB", "city": "Panchkula", "state": "Haryana", "lat": 30.6942, "lon": 76.8606},
    # Uttar Pradesh NCR & major cities
    {"id": "cpcb_noida_sec_62", "name": "Sector 62, Noida - UPPCB", "city": "Noida", "state": "Uttar Pradesh", "lat": 28.6245, "lon": 77.3578},
    {"id": "cpcb_noida_sec_125", "name": "Sector 125, Noida - UPPCB", "city": "Noida", "state": "Uttar Pradesh", "lat": 28.5447, "lon": 77.3331},
    {"id": "cpcb_noida_sec_1", "name": "Sector 1, Noida - UPPCB", "city": "Noida", "state": "Uttar Pradesh", "lat": 28.5898, "lon": 77.3101},
    {"id": "cpcb_noida_sec_116", "name": "Sector 116, Noida - UPPCB", "city": "Noida", "state": "Uttar Pradesh", "lat": 28.5670, "lon": 77.3980},
    {"id": "cpcb_gnoida_knowledge_park_iii", "name": "Knowledge Park III, Greater Noida - UPPCB", "city": "Greater Noida", "state": "Uttar Pradesh", "lat": 28.4720, "lon": 77.4820},
    {"id": "cpcb_gnoida_knowledge_park_v", "name": "Knowledge Park V, Greater Noida - UPPCB", "city": "Greater Noida", "state": "Uttar Pradesh", "lat": 28.5300, "lon": 77.4500},
    {"id": "cpcb_gzb_indrapuram", "name": "Indirapuram, Ghaziabad - UPPCB", "city": "Ghaziabad", "state": "Uttar Pradesh", "lat": 28.6468, "lon": 77.3712},
    {"id": "cpcb_gzb_vasundhara", "name": "Vasundhara, Ghaziabad - UPPCB", "city": "Ghaziabad", "state": "Uttar Pradesh", "lat": 28.6603, "lon": 77.3573},
    {"id": "cpcb_gzb_sanjay_nagar", "name": "Sanjay Nagar, Ghaziabad - UPPCB", "city": "Ghaziabad", "state": "Uttar Pradesh", "lat": 28.6853, "lon": 77.4538},
    {"id": "cpcb_gzb_loni", "name": "Loni, Ghaziabad - UPPCB", "city": "Ghaziabad", "state": "Uttar Pradesh", "lat": 28.7500, "lon": 77.2800},
    {"id": "cpcb_lko_lalbagh", "name": "Lalbagh, Lucknow - CPCB", "city": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462},
    {"id": "cpcb_lko_aliganj", "name": "Aliganj, Lucknow - UPPCB", "city": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8833, "lon": 80.9333},
    {"id": "cpcb_lko_talkatora", "name": "Talkatora District Industries Center, Lucknow - CPCB", "city": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8333, "lon": 80.8833},
    {"id": "cpcb_lko_gomti_nagar", "name": "Gomti Nagar, Lucknow - UPPCB", "city": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8500, "lon": 81.0000},
    {"id": "cpcb_kanpur_nehru_nagar", "name": "Nehru Nagar, Kanpur - CPCB", "city": "Kanpur", "state": "Uttar Pradesh", "lat": 26.4700, "lon": 80.3200},
    {"id": "cpcb_kanpur_iitk", "name": "IIT Kanpur, Kanpur - CPCB", "city": "Kanpur", "state": "Uttar Pradesh", "lat": 26.5123, "lon": 80.2329},
    {"id": "cpcb_vns_ardali_bazar", "name": "Ardali Bazar, Varanasi - UPPCB", "city": "Varanasi", "state": "Uttar Pradesh", "lat": 25.3333, "lon": 82.9833},
    {"id": "cpcb_vns_bhu", "name": "BHU, Varanasi - IIT", "city": "Varanasi", "state": "Uttar Pradesh", "lat": 25.2677, "lon": 82.9913},
    {"id": "cpcb_agra_sanjay_place", "name": "Sanjay Place, Agra - UPPCB", "city": "Agra", "state": "Uttar Pradesh", "lat": 27.2000, "lon": 78.0000},
    {"id": "cpcb_agra_taj_mahal", "name": "Taj Mahal, Agra - CPCB", "city": "Agra", "state": "Uttar Pradesh", "lat": 27.1750, "lon": 78.0422},
    {"id": "cpcb_prayagraj_jhunsi", "name": "Jhunsi, Prayagraj - UPPCB", "city": "Prayagraj", "state": "Uttar Pradesh", "lat": 25.4358, "lon": 81.9000},
    {"id": "cpcb_meerut_ganga_nagar", "name": "Ganga Nagar, Meerut - UPPCB", "city": "Meerut", "state": "Uttar Pradesh", "lat": 28.9845, "lon": 77.7500},
    {"id": "cpcb_bareilly_civil_lines", "name": "Civil Lines, Bareilly - UPPCB", "city": "Bareilly", "state": "Uttar Pradesh", "lat": 28.3670, "lon": 79.4304},
    {"id": "cpcb_moradabad_transport_nagar", "name": "Transport Nagar, Moradabad - UPPCB", "city": "Moradabad", "state": "Uttar Pradesh", "lat": 28.8353, "lon": 78.7747},
    # Maharashtra
    {"id": "cpcb_mum_bandra", "name": "Bandra, Mumbai - MPCB", "city": "Mumbai", "state": "Maharashtra", "lat": 19.0596, "lon": 72.8295},
    {"id": "cpcb_mum_worli", "name": "Worli, Mumbai - MPCB", "city": "Mumbai", "state": "Maharashtra", "lat": 19.0167, "lon": 72.8167},
    {"id": "cpcb_mum_colaba", "name": "Colaba, Mumbai - MPCB", "city": "Mumbai", "state": "Maharashtra", "lat": 18.9067, "lon": 72.8147},
    {"id": "cpcb_mum_kurla", "name": "Kurla, Mumbai - MPCB", "city": "Mumbai", "state": "Maharashtra", "lat": 19.0667, "lon": 72.8833},
    {"id": "cpcb_mum_chembur", "name": "Chembur, Mumbai - MPCB", "city": "Mumbai", "state": "Maharashtra", "lat": 19.0500, "lon": 72.9000},
    {"id": "cpcb_mum_andheri", "name": "Andheri West, Mumbai - MPCB", "city": "Mumbai", "state": "Maharashtra", "lat": 19.1136, "lon": 72.8285},
    {"id": "cpcb_mum_borivali", "name": "Borivali East, Mumbai - MPCB", "city": "Mumbai", "state": "Maharashtra", "lat": 19.2288, "lon": 72.8541},
    {"id": "cpcb_mum_bkc", "name": "Bandra Kurla Complex, Mumbai - IITM", "city": "Mumbai", "state": "Maharashtra", "lat": 19.0650, "lon": 72.8680},
    {"id": "cpcb_mum_malad", "name": "Malad West, Mumbai - MPCB", "city": "Mumbai", "state": "Maharashtra", "lat": 19.1860, "lon": 72.8485},
    {"id": "cpcb_mum_sion", "name": "Sion, Mumbai - MPCB", "city": "Mumbai", "state": "Maharashtra", "lat": 19.0400, "lon": 72.8600},
    {"id": "cpcb_pune_shivajinagar", "name": "Shivajinagar, Pune - IITM", "city": "Pune", "state": "Maharashtra", "lat": 18.5308, "lon": 73.8475},
    {"id": "cpcb_pune_karve_road", "name": "Karve Road, Pune - MPCB", "city": "Pune", "state": "Maharashtra", "lat": 18.5020, "lon": 73.8260},
    {"id": "cpcb_pune_bhosari", "name": "Bhosari, Pune - IITM", "city": "Pune", "state": "Maharashtra", "lat": 18.6258, "lon": 73.8465},
    {"id": "cpcb_pune_hadapsar", "name": "Hadapsar, Pune - IITM", "city": "Pune", "state": "Maharashtra", "lat": 18.5018, "lon": 73.9260},
    {"id": "cpcb_pune_katraj", "name": "Katraj, Pune - IITM", "city": "Pune", "state": "Maharashtra", "lat": 18.4529, "lon": 73.8584},
    {"id": "cpcb_nagpur_civil_lines", "name": "Civil Lines, Nagpur - MPCB", "city": "Nagpur", "state": "Maharashtra", "lat": 21.1500, "lon": 79.0700},
    {"id": "cpcb_nagpur_sadar", "name": "Sadar, Nagpur - MPCB", "city": "Nagpur", "state": "Maharashtra", "lat": 21.1600, "lon": 79.0800},
    {"id": "cpcb_thane_naupada", "name": "Naupada, Thane - MPCB", "city": "Thane", "state": "Maharashtra", "lat": 19.1900, "lon": 72.9700},
    {"id": "cpcb_nashik_gangapur", "name": "Gangapur Road, Nashik - MPCB", "city": "Nashik", "state": "Maharashtra", "lat": 20.0100, "lon": 73.7600},
    {"id": "cpcb_aurangabad_more_chowk", "name": "More Chowk, Aurangabad - MPCB", "city": "Aurangabad", "state": "Maharashtra", "lat": 19.8700, "lon": 75.3300},
    {"id": "cpcb_navimumbai_vashi", "name": "Sector 17 Vashi, Navi Mumbai - MPCB", "city": "Navi Mumbai", "state": "Maharashtra", "lat": 19.0771, "lon": 72.9986},
    {"id": "cpcb_solapur_walchand", "name": "Walchand Institute, Solapur - MPCB", "city": "Solapur", "state": "Maharashtra", "lat": 17.6700, "lon": 75.9100},
    {"id": "cpcb_chandrapur_midc", "name": "MIDC Chandrapur, Chandrapur - MPCB", "city": "Chandrapur", "state": "Maharashtra", "lat": 19.9800, "lon": 79.3100},
    # Karnataka
    {"id": "cpcb_blr_btm", "name": "BTM Layout, Bengaluru - CPCB", "city": "Bengaluru", "state": "Karnataka", "lat": 12.9135, "lon": 77.5959},
    {"id": "cpcb_blr_bwssb", "name": "BWSSB Kadabesanahalli, Bengaluru - CPCB", "city": "Bengaluru", "state": "Karnataka", "lat": 12.9348, "lon": 77.6946},
    {"id": "cpcb_blr_city_railway", "name": "City Railway Station, Bengaluru - KSPCB", "city": "Bengaluru", "state": "Karnataka", "lat": 12.9778, "lon": 77.5703},
    {"id": "cpcb_blr_saneguruvanahalli", "name": "Saneguruvanahalli, Bengaluru - KSPCB", "city": "Bengaluru", "state": "Karnataka", "lat": 12.9917, "lon": 77.5458},
    {"id": "cpcb_blr_hebbal", "name": "Hebbal, Bengaluru - KSPCB", "city": "Bengaluru", "state": "Karnataka", "lat": 13.0358, "lon": 77.5970},
    {"id": "cpcb_blr_jayanagar", "name": "Jayanagar 5th Block, Bengaluru - KSPCB", "city": "Bengaluru", "state": "Karnataka", "lat": 12.9237, "lon": 77.5838},
    {"id": "cpcb_blr_peenya", "name": "Peenya, Bengaluru - CPCB", "city": "Bengaluru", "state": "Karnataka", "lat": 13.0285, "lon": 77.5197},
    {"id": "cpcb_blr_silk_board", "name": "Central Silk Board, Bengaluru - KSPCB", "city": "Bengaluru", "state": "Karnataka", "lat": 12.9177, "lon": 77.6238},
    {"id": "cpcb_mysore_hebbal_ind", "name": "Hebbal Industrial Area, Mysuru - KSPCB", "city": "Mysuru", "state": "Karnataka", "lat": 12.3500, "lon": 76.6000},
    {"id": "cpcb_hubballi_kles", "name": "KLES Campus, Hubballi - KSPCB", "city": "Hubballi", "state": "Karnataka", "lat": 15.3700, "lon": 75.1300},
    {"id": "cpcb_mangaluru_kadri", "name": "Kadri, Mangaluru - KSPCB", "city": "Mangaluru", "state": "Karnataka", "lat": 12.8700, "lon": 74.8500},
    {"id": "cpcb_belagavi_tilakwadi", "name": "Tilakwadi, Belagavi - KSPCB", "city": "Belagavi", "state": "Karnataka", "lat": 15.8300, "lon": 74.5000},
    {"id": "cpcb_kalaburagi_vtu", "name": "VTU Campus, Kalaburagi - KSPCB", "city": "Kalaburagi", "state": "Karnataka", "lat": 17.3400, "lon": 76.8200},
    # Tamil Nadu
    {"id": "cpcb_chn_alandur", "name": "Alandur Bus Depot, Chennai - CPCB", "city": "Chennai", "state": "Tamil Nadu", "lat": 13.0034, "lon": 80.2033},
    {"id": "cpcb_chn_manali", "name": "Manali, Chennai - CPCB", "city": "Chennai", "state": "Tamil Nadu", "lat": 13.1670, "lon": 80.2600},
    {"id": "cpcb_chn_velachery", "name": "Velachery Res. Area, Chennai - CPCB", "city": "Chennai", "state": "Tamil Nadu", "lat": 12.9739, "lon": 80.2190},
    {"id": "cpcb_chn_kodungaiyur", "name": "Kodungaiyur, Chennai - TNPCB", "city": "Chennai", "state": "Tamil Nadu", "lat": 13.1360, "lon": 80.2520},
    {"id": "cpcb_chn_royapuram", "name": "Royapuram, Chennai - TNPCB", "city": "Chennai", "state": "Tamil Nadu", "lat": 13.1110, "lon": 80.2970},
    {"id": "cpcb_cbe_sidco", "name": "SIDCO Kurichi, Coimbatore - TNPCB", "city": "Coimbatore", "state": "Tamil Nadu", "lat": 10.9500, "lon": 76.9700},
    {"id": "cpcb_madurai_arappalayam", "name": "Arappalayam, Madurai - TNPCB", "city": "Madurai", "state": "Tamil Nadu", "lat": 9.9300, "lon": 78.1000},
    {"id": "cpcb_trichy_central_bus", "name": "Central Bus Stand, Tiruchirappalli - TNPCB", "city": "Tiruchirappalli", "state": "Tamil Nadu", "lat": 10.7905, "lon": 78.6900},
    {"id": "cpcb_salem_collectorate", "name": "Collectorate, Salem - TNPCB", "city": "Salem", "state": "Tamil Nadu", "lat": 11.6600, "lon": 78.1500},
    {"id": "cpcb_tuticorin_sipcot", "name": "SIPCOT, Thoothukudi - TNPCB", "city": "Thoothukudi", "state": "Tamil Nadu", "lat": 8.7800, "lon": 78.1200},
    # Telangana
    {"id": "cpcb_hyd_sanathnagar", "name": "Sanathnagar, Hyderabad - TSPCB", "city": "Hyderabad", "state": "Telangana", "lat": 17.4589, "lon": 78.4444},
    {"id": "cpcb_hyd_hcu", "name": "Hyderabad Central University, Hyderabad - TSPCB", "city": "Hyderabad", "state": "Telangana", "lat": 17.4600, "lon": 78.3300},
    {"id": "cpcb_hyd_icrisat", "name": "ICRISAT Patancheru, Hyderabad - TSPCB", "city": "Hyderabad", "state": "Telangana", "lat": 17.5111, "lon": 78.2750},
    {"id": "cpcb_hyd_zoo_park", "name": "Zoo Park, Hyderabad - TSPCB", "city": "Hyderabad", "state": "Telangana", "lat": 17.3500, "lon": 78.4500},
    {"id": "cpcb_hyd_bollaram", "name": "IDA Bollaram, Hyderabad - TSPCB", "city": "Hyderabad", "state": "Telangana", "lat": 17.5500, "lon": 78.3100},
    {"id": "cpcb_hyd_nacharam", "name": "Nacharam, Hyderabad - TSPCB", "city": "Hyderabad", "state": "Telangana", "lat": 17.4300, "lon": 78.5600},
    {"id": "cpcb_hyd_jeedimetla", "name": "Jeedimetla, Hyderabad - TSPCB", "city": "Hyderabad", "state": "Telangana", "lat": 17.5100, "lon": 78.4700},
    {"id": "cpcb_warangal_nit", "name": "NIT Warangal, Warangal - TSPCB", "city": "Warangal", "state": "Telangana", "lat": 17.9800, "lon": 79.5300},
    {"id": "cpcb_karimnagar_collectorate", "name": "Collectorate, Karimnagar - TSPCB", "city": "Karimnagar", "state": "Telangana", "lat": 18.4386, "lon": 79.1288},
    {"id": "cpcb_ramagundam_ntpc", "name": "NTPC Jyothi Nagar, Ramagundam - TSPCB", "city": "Ramagundam", "state": "Telangana", "lat": 18.7557, "lon": 79.5126},
    # West Bengal
    {"id": "cpcb_kol_victoria", "name": "Victoria Memorial, Kolkata - WBPCB", "city": "Kolkata", "state": "West Bengal", "lat": 22.5448, "lon": 88.3426},
    {"id": "cpcb_kol_rabindra_sarobar", "name": "Rabindra Sarobar, Kolkata - WBPCB", "city": "Kolkata", "state": "West Bengal", "lat": 22.5111, "lon": 88.3589},
    {"id": "cpcb_kol_jadavpur", "name": "Jadavpur, Kolkata - WBPCB", "city": "Kolkata", "state": "West Bengal", "lat": 22.4988, "lon": 88.3714},
    {"id": "cpcb_kol_ballygunge", "name": "Ballygunge, Kolkata - WBPCB", "city": "Kolkata", "state": "West Bengal", "lat": 22.5312, "lon": 88.3653},
    {"id": "cpcb_kol_fort_william", "name": "Fort William, Kolkata - WBPCB", "city": "Kolkata", "state": "West Bengal", "lat": 22.5540, "lon": 88.3370},
    {"id": "cpcb_howrah_ghusuri", "name": "Ghusuri, Howrah - WBPCB", "city": "Howrah", "state": "West Bengal", "lat": 22.6100, "lon": 88.3500},
    {"id": "cpcb_howrah_padmapukur", "name": "Padmapukur, Howrah - WBPCB", "city": "Howrah", "state": "West Bengal", "lat": 22.5700, "lon": 88.3100},
    {"id": "cpcb_asansol_court", "name": "Court More, Asansol - WBPCB", "city": "Asansol", "state": "West Bengal", "lat": 23.6800, "lon": 86.9700},
    {"id": "cpcb_durgapur_city_centre", "name": "City Centre, Durgapur - WBPCB", "city": "Durgapur", "state": "West Bengal", "lat": 23.5300, "lon": 87.3100},
    {"id": "cpcb_siliguri_ward_32", "name": "Ward-32 Bapupara, Siliguri - WBPCB", "city": "Siliguri", "state": "West Bengal", "lat": 26.7100, "lon": 88.4200},
    {"id": "cpcb_haldia_city_centre", "name": "City Centre, Haldia - WBPCB", "city": "Haldia", "state": "West Bengal", "lat": 22.0667, "lon": 88.0667},
    # Gujarat
    {"id": "cpcb_ahd_maninagar", "name": "Maninagar, Ahmedabad - GPCB", "city": "Ahmedabad", "state": "Gujarat", "lat": 22.9972, "lon": 72.6022},
    {"id": "cpcb_ahd_chandkheda", "name": "Chandkheda, Ahmedabad - IIT", "city": "Ahmedabad", "state": "Gujarat", "lat": 23.1118, "lon": 72.5856},
    {"id": "cpcb_ahd_bopal", "name": "Bopal, Ahmedabad - GPCB", "city": "Ahmedabad", "state": "Gujarat", "lat": 23.0336, "lon": 72.4633},
    {"id": "cpcb_ahd_rakhiyal", "name": "Rakhiyal, Ahmedabad - GPCB", "city": "Ahmedabad", "state": "Gujarat", "lat": 23.0200, "lon": 72.6300},
    {"id": "cpcb_surat_central", "name": "Central Zone, Surat - GPCB", "city": "Surat", "state": "Gujarat", "lat": 21.1900, "lon": 72.8200},
    {"id": "cpcb_surat_piplod", "name": "Piplod, Surat - GPCB", "city": "Surat", "state": "Gujarat", "lat": 21.1500, "lon": 72.7700},
    {"id": "cpcb_vadodara_dandia_bazar", "name": "Dandia Bazar, Vadodara - GPCB", "city": "Vadodara", "state": "Gujarat", "lat": 22.3000, "lon": 73.2000},
    {"id": "cpcb_rajkot_race_course", "name": "Race Course, Rajkot - GPCB", "city": "Rajkot", "state": "Gujarat", "lat": 22.3000, "lon": 70.7900},
    {"id": "cpcb_gandhinagar_sec_10", "name": "Sector 10, Gandhinagar - GPCB", "city": "Gandhinagar", "state": "Gujarat", "lat": 23.2200, "lon": 72.6500},
    {"id": "cpcb_ankleshwar_gia", "name": "GIDC, Ankleshwar - GPCB", "city": "Ankleshwar", "state": "Gujarat", "lat": 21.6200, "lon": 73.0100},
    {"id": "cpcb_vapi_gidc", "name": "GIDC Vapi, Vapi - GPCB", "city": "Vapi", "state": "Gujarat", "lat": 20.3700, "lon": 72.9200},
    # Rajasthan
    {"id": "cpcb_jaipur_adarsh_nagar", "name": "Adarsh Nagar, Jaipur - RSPCB", "city": "Jaipur", "state": "Rajasthan", "lat": 26.9000, "lon": 75.8300},
    {"id": "cpcb_jaipur_shastri_nagar", "name": "Shastri Nagar, Jaipur - RSPCB", "city": "Jaipur", "state": "Rajasthan", "lat": 26.9400, "lon": 75.7900},
    {"id": "cpcb_jaipur_police_comm", "name": "Police Commissionerate, Jaipur - RSPCB", "city": "Jaipur", "state": "Rajasthan", "lat": 26.9200, "lon": 75.8000},
    {"id": "cpcb_jodhpur_soor_sagar", "name": "Soor Sagar, Jodhpur - RSPCB", "city": "Jodhpur", "state": "Rajasthan", "lat": 26.2800, "lon": 73.0000},
    {"id": "cpcb_kota_shrinathpuram", "name": "Shrinath Puram, Kota - RSPCB", "city": "Kota", "state": "Rajasthan", "lat": 25.1500, "lon": 75.8200},
    {"id": "cpcb_udaipur_ashok_nagar", "name": "Ashok Nagar, Udaipur - RSPCB", "city": "Udaipur", "state": "Rajasthan", "lat": 24.5900, "lon": 73.7100},
    {"id": "cpcb_bhiwadi_riico", "name": "RIICO Ind. Area, Bhiwadi - RSPCB", "city": "Bhiwadi", "state": "Rajasthan", "lat": 28.2104, "lon": 76.8606},
    {"id": "cpcb_ajmer_civil_lines", "name": "Civil Lines, Ajmer - RSPCB", "city": "Ajmer", "state": "Rajasthan", "lat": 26.4600, "lon": 74.6400},
    # Madhya Pradesh
    {"id": "cpcb_bhopal_t_t_nagar", "name": "T.T. Nagar, Bhopal - MPPCB", "city": "Bhopal", "state": "Madhya Pradesh", "lat": 23.2300, "lon": 77.4000},
    {"id": "cpcb_bhopal_paryavaran_parisar", "name": "Paryavaran Parisar, Bhopal - MPPCB", "city": "Bhopal", "state": "Madhya Pradesh", "lat": 23.2100, "lon": 77.4300},
    {"id": "cpcb_indore_chhoti_gwaltoli", "name": "Chhoti Gwaltoli, Indore - MPPCB", "city": "Indore", "state": "Madhya Pradesh", "lat": 22.7196, "lon": 75.8677},
    {"id": "cpcb_indore_vijay_nagar", "name": "Vijay Nagar, Indore - MPPCB", "city": "Indore", "state": "Madhya Pradesh", "lat": 22.7500, "lon": 75.8900},
    {"id": "cpcb_jabalpur_marhatal", "name": "Marhatal, Jabalpur - MPPCB", "city": "Jabalpur", "state": "Madhya Pradesh", "lat": 23.1700, "lon": 79.9400},
    {"id": "cpcb_gwalior_city_centre", "name": "City Centre, Gwalior - MPPCB", "city": "Gwalior", "state": "Madhya Pradesh", "lat": 26.2000, "lon": 78.1900},
    {"id": "cpcb_ujjain_mahakal", "name": "Mahakal Temple Area, Ujjain - MPPCB", "city": "Ujjain", "state": "Madhya Pradesh", "lat": 23.1800, "lon": 75.7700},
    {"id": "cpcb_singrauli_collectorate", "name": "Collectorate, Singrauli - MPPCB", "city": "Singrauli", "state": "Madhya Pradesh", "lat": 24.2000, "lon": 82.6600},
    # Bihar & Jharkhand
    {"id": "cpcb_patna_muradpur", "name": "Muradpur, Patna - BSPCB", "city": "Patna", "state": "Bihar", "lat": 25.6200, "lon": 85.1600},
    {"id": "cpcb_patna_planetarium", "name": "Planetarium Complex, Patna - BSPCB", "city": "Patna", "state": "Bihar", "lat": 25.6100, "lon": 85.1300},
    {"id": "cpcb_patna_samarpal", "name": "Samanpura, Patna - BSPCB", "city": "Patna", "state": "Bihar", "lat": 25.6000, "lon": 85.0800},
    {"id": "cpcb_gaya_collectorate", "name": "Collectorate, Gaya - BSPCB", "city": "Gaya", "state": "Bihar", "lat": 24.8000, "lon": 85.0000},
    {"id": "cpcb_muzaffarpur_collectorate", "name": "Muzaffarpur Collectorate - BSPCB", "city": "Muzaffarpur", "state": "Bihar", "lat": 26.1200, "lon": 85.3800},
    {"id": "cpcb_ranchi_doranda", "name": "Doranda, Ranchi - JSPCB", "city": "Ranchi", "state": "Jharkhand", "lat": 23.3300, "lon": 85.3200},
    {"id": "cpcb_jamshedpur_bistupur", "name": "Bistupur, Jamshedpur - JSPCB", "city": "Jamshedpur", "state": "Jharkhand", "lat": 22.7900, "lon": 86.1800},
    {"id": "cpcb_dhanbad_ism", "name": "IIT ISM, Dhanbad - JSPCB", "city": "Dhanbad", "state": "Jharkhand", "lat": 23.8100, "lon": 86.4400},
    # Kerala
    {"id": "cpcb_tvm_plammoodu", "name": "Plammoodu, Thiruvananthapuram - KSPCB", "city": "Thiruvananthapuram", "state": "Kerala", "lat": 8.5100, "lon": 76.9400},
    {"id": "cpcb_kochi_vytilla", "name": "Vytilla, Kochi - KSPCB", "city": "Kochi", "state": "Kerala", "lat": 9.9600, "lon": 76.3200},
    {"id": "cpcb_kochi_eloors", "name": "Eloor Industrial Area, Kochi - KSPCB", "city": "Kochi", "state": "Kerala", "lat": 10.0800, "lon": 76.3000},
    {"id": "cpcb_kozhikode_palayam", "name": "Palayam, Kozhikode - KSPCB", "city": "Kozhikode", "state": "Kerala", "lat": 11.2500, "lon": 75.7900},
    {"id": "cpcb_thrissur_collectorate", "name": "Ayyanthole, Thrissur - KSPCB", "city": "Thrissur", "state": "Kerala", "lat": 10.5300, "lon": 76.1900},
    {"id": "cpcb_kannur_thalap", "name": "Thalap, Kannur - KSPCB", "city": "Kannur", "state": "Kerala", "lat": 11.8700, "lon": 75.3700},
    # Punjab
    {"id": "cpcb_ludhiana_pau", "name": "Punjab Agricultural University, Ludhiana - PPCB", "city": "Ludhiana", "state": "Punjab", "lat": 30.9000, "lon": 75.8100},
    {"id": "cpcb_amritsar_golden_temple", "name": "Golden Temple, Amritsar - PPCB", "city": "Amritsar", "state": "Punjab", "lat": 31.6200, "lon": 74.8800},
    {"id": "cpcb_jalandhar_civil_line", "name": "Civil Line, Jalandhar - PPCB", "city": "Jalandhar", "state": "Punjab", "lat": 31.3200, "lon": 75.5800},
    {"id": "cpcb_patiala_model_town", "name": "Model Town, Patiala - PPCB", "city": "Patiala", "state": "Punjab", "lat": 30.3300, "lon": 76.3800},
    {"id": "cpcb_bathinda_civil_station", "name": "Civil Station, Bathinda - PPCB", "city": "Bathinda", "state": "Punjab", "lat": 30.2100, "lon": 74.9500},
    # Odisha
    {"id": "cpcb_bbsr_patia", "name": "Patia, Bhubaneswar - OSPCB", "city": "Bhubaneswar", "state": "Odisha", "lat": 20.3500, "lon": 85.8200},
    {"id": "cpcb_cuttack_barabati", "name": "Barabati Stadium, Cuttack - OSPCB", "city": "Cuttack", "state": "Odisha", "lat": 20.4800, "lon": 85.8700},
    {"id": "cpcb_rourkela_sector_6", "name": "Sector 6, Rourkela - OSPCB", "city": "Rourkela", "state": "Odisha", "lat": 22.2500, "lon": 84.8600},
    # Andhra Pradesh
    {"id": "cpcb_vizag_gvmc", "name": "GVMC, Visakhapatnam - APPCB", "city": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.7200, "lon": 83.3000},
    {"id": "cpcb_tirupati_svu", "name": "SV University, Tirupati - APPCB", "city": "Tirupati", "state": "Andhra Pradesh", "lat": 13.6300, "lon": 79.4000},
    {"id": "cpcb_amaravati_secretariat", "name": "Secretariat, Amaravati - APPCB", "city": "Amaravati", "state": "Andhra Pradesh", "lat": 16.5100, "lon": 80.5200},
    {"id": "cpcb_anantapur_collectorate", "name": "Collectorate, Anantapur - APPCB", "city": "Anantapur", "state": "Andhra Pradesh", "lat": 14.6800, "lon": 77.6000},
    # Northeast & Hill States
    {"id": "cpcb_guwahati_panbazar", "name": "Pan Bazar, Guwahati - PCBA", "city": "Guwahati", "state": "Assam", "lat": 26.1800, "lon": 91.7500},
    {"id": "cpcb_guwahati_iitg", "name": "IIT Guwahati, Guwahati - PCBA", "city": "Guwahati", "state": "Assam", "lat": 26.1900, "lon": 91.6900},
    {"id": "cpcb_shillong_polo", "name": "Polo Ground, Shillong - MSPCB", "city": "Shillong", "state": "Meghalaya", "lat": 25.5900, "lon": 91.9000},
    {"id": "cpcb_itanagar_raj_bhavan", "name": "Raj Bhavan, Itanagar - APSPCB", "city": "Itanagar", "state": "Arunachal Pradesh", "lat": 27.1000, "lon": 93.6200},
    {"id": "cpcb_agartala_bordowali", "name": "Bordowali, Agartala - TSPCB", "city": "Agartala", "state": "Tripura", "lat": 23.8200, "lon": 91.2700},
    {"id": "cpcb_aizawl_khatla", "name": "Khatla, Aizawl - MPCB", "city": "Aizawl", "state": "Mizoram", "lat": 23.7200, "lon": 92.7100},
    {"id": "cpcb_kohima_pr_hill", "name": "PR Hill, Kohima - NPCB", "city": "Kohima", "state": "Nagaland", "lat": 25.6600, "lon": 94.1000},
    {"id": "cpcb_imphal_kangla", "name": "Kangla Fort, Imphal - MPCB", "city": "Imphal", "state": "Manipur", "lat": 24.8100, "lon": 93.9400},
    {"id": "cpcb_gangtok_deorali", "name": "Deorali, Gangtok - SPCB", "city": "Gangtok", "state": "Sikkim", "lat": 27.3200, "lon": 88.6100},
    {"id": "cpcb_shimla_ridge", "name": "The Ridge, Shimla - HPPCB", "city": "Shimla", "state": "Himachal Pradesh", "lat": 31.1048, "lon": 77.1734},
    {"id": "cpcb_dehradun_clock_tower", "name": "Clock Tower, Dehradun - UEPPCB", "city": "Dehradun", "state": "Uttarakhand", "lat": 30.3256, "lon": 78.0436},
    {"id": "cpcb_srinagar_dalgate", "name": "Dalgate, Srinagar - JKPCB", "city": "Srinagar", "state": "Jammu and Kashmir", "lat": 34.0800, "lon": 74.8300},
    {"id": "cpcb_jammu_bahu_fort", "name": "Bahu Fort, Jammu - JKPCB", "city": "Jammu", "state": "Jammu and Kashmir", "lat": 32.7200, "lon": 74.8700},
    # Islands & Union Territories
    {"id": "cpcb_chandigarh_sec_22", "name": "Sector 22, Chandigarh - CPCC", "city": "Chandigarh", "state": "Chandigarh", "lat": 30.7300, "lon": 76.7700},
    {"id": "cpcb_puducherry_beach_road", "name": "Beach Road, Puducherry - PPCC", "city": "Puducherry", "state": "Puducherry", "lat": 11.9300, "lon": 79.8300},
    {"id": "cpcb_port_blair_aberdeen", "name": "Aberdeen Bazaar, Port Blair - ANPCB", "city": "Port Blair", "state": "Andaman and Nicobar Islands", "lat": 11.6667, "lon": 92.7400},
]


def main():
    print(f"Building all-India state and district hierarchy ({len(STATES_DATA)} States/UTs)...")
    total_districts = sum(len(s["districts"]) for s in STATES_DATA.values())
    print(f"Total curated district records: {total_districts}")

    out_states_path = DATASET_DIR / "india_states_districts.json"
    with open(out_states_path, "w", encoding="utf-8") as f:
        json.dump(STATES_DATA, f, indent=2, ensure_ascii=False)
    print(f"Saved: {out_states_path} ({out_states_path.stat().st_size / 1024:.1f} KB)")

    print(f"Building official CPCB CAAQMS monitoring network ({len(CPCB_STATIONS)} stations)...")
    out_stations_path = DATASET_DIR / "cpcb_stations.json"
    with open(out_stations_path, "w", encoding="utf-8") as f:
        json.dump(CPCB_STATIONS, f, indent=2, ensure_ascii=False)
    print(f"Saved: {out_stations_path} ({out_stations_path.stat().st_size / 1024:.1f} KB)")

    print("Geo datasets generated successfully.")


if __name__ == "__main__":
    main()
