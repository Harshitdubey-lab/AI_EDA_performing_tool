import os
import csv
import random
from datetime import datetime, timedelta

def generate():
    random.seed(12345)
    os.makedirs('backend/samples', exist_ok=True)
    os.makedirs('storage/uploads', exist_ok=True)
    os.makedirs('storage/reports', exist_ok=True)
    os.makedirs('storage/models', exist_ok=True)

    sample_file = 'backend/samples/sample_sales_data.csv'

    headers = [
        'order_id', 'order_date', 'customer_id', 'region', 'city',
        'product_category', 'product_name', 'quantity', 'unit_price',
        'discount', 'revenue', 'profit', 'payment_method',
        'customer_segment', 'delivery_days', 'returned'
    ]

    regions_cities = {
        'North America': ['New York', 'Los Angeles', 'Chicago', 'Toronto', 'Houston'],
        'Europe': ['London', 'Berlin', 'Paris', 'Amsterdam', 'Madrid'],
        'Asia Pacific': ['Tokyo', 'Singapore', 'Sydney', 'Mumbai', 'Seoul'],
        'Latin America': ['Sao Paulo', 'Mexico City', 'Buenos Aires', 'Bogota', 'Santiago']
    }

    products_by_cat = {
        'Electronics': [
            ('Ultra Pro Smartphone', 799.0),
            ('Ergonomic Laptop 15"', 1199.0),
            ('Noise-Canceling Headphones', 249.0),
            ('4K Ultra Gaming Monitor', 499.0),
            ('Wireless Fast Charger', 49.0)
        ],
        'Furniture': [
            ('Executive Ergonomic Chair', 349.0),
            ('Adjustable Standing Desk', 599.0),
            ('Solid Oak Conference Table', 899.0),
            ('Modern Minimalist Bookcase', 199.0),
            ('Lounge Recliner Sofa', 749.0)
        ],
        'Office Supplies': [
            ('Heavy Duty Paper Shredder', 129.0),
            ('Premium Gel Pen 20-Pack', 24.0),
            ('Recycled Multipurpose Paper', 39.0),
            ('Locking Storage Cabinet', 219.0),
            ('Desk Organization Tray', 18.0)
        ],
        'Fashion & Apparel': [
            ('Waterproof Trench Coat', 189.0),
            ('Italian Leather Chelsea Boots', 219.0),
            ('Titanium Chrono Watch', 299.0),
            ('Business Travel Backpack', 89.0),
            ('Merino Wool Blazer', 249.0)
        ]
    }

    segments = ['Consumer', 'Corporate', 'Small Business']
    payments = ['Credit Card', 'PayPal', 'Direct Wire', 'Corporate Invoice']
    start_date = datetime(2023, 1, 1)

    rows = []
    for i in range(1, 651):
        oid = f"ORD-{10000+i}"
        cid = f"CUST-{random.randint(100, 350)}"
        
        day_offset = int((i / 650.0) * 540) + random.randint(-4, 4)
        cur_date = (start_date + timedelta(days=max(0, day_offset))).strftime('%Y-%m-%d')
        
        region = random.choice(list(regions_cities.keys()))
        city = random.choice(regions_cities[region])
        
        cat = random.choice(list(products_by_cat.keys()))
        prod_name, base_price = random.choice(products_by_cat[cat])
        
        qty = random.choices([1, 2, 3, 4, 5, 8, 10], weights=[35, 25, 15, 10, 8, 4, 3])[0]
        unit_price = round(base_price * random.uniform(0.95, 1.05), 2)
        discount = random.choices([0.0, 0.05, 0.10, 0.15, 0.20, 0.30], weights=[40, 20, 15, 12, 8, 5])[0]
        
        gross = qty * unit_price
        revenue = round(gross * (1.0 - discount), 2)
        
        delivery_days = random.randint(1, 9)
        if region in ['Latin America', 'Asia Pacific'] and random.random() < 0.2:
            delivery_days += random.randint(3, 5)
            
        base_margin = 0.35 if cat == 'Office Supplies' else (0.28 if cat == 'Electronics' else (0.32 if cat == 'Fashion & Apparel' else 0.22))
        effective_margin = base_margin - (discount * 0.75)
        shipping_cost = 8.0 + (qty * 2.5) + (5.0 if delivery_days > 5 else 0.0)
        profit = round((revenue * effective_margin) - shipping_cost, 2)
        
        payment = random.choice(payments)
        segment = random.choice(segments)
        
        return_prob = 0.07
        if cat == 'Fashion & Apparel': return_prob += 0.12
        if delivery_days > 6: return_prob += 0.14
        if discount >= 0.20: return_prob += 0.10
        if segment == 'Consumer': return_prob += 0.04
        returned = 'Yes' if random.random() < min(return_prob, 0.75) else 'No'
        
        rows.append([
            oid, cur_date, cid, region, city, cat, prod_name, qty, unit_price,
            discount, revenue, profit, payment, segment, delivery_days, returned
        ])

    with open(sample_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

    # Also copy to storage/uploads as sample
    dest_copy = 'storage/uploads/sample_sales_data.csv'
    with open(dest_copy, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

    print(f"Generated {len(rows)} rows in {sample_file} and {dest_copy}")

if __name__ == '__main__':
    generate()
