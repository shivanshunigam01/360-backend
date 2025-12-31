# Job Card API Testing Guide for Postman

## Base URL
```
http://localhost:5000/api/job-cards
```
(Replace `localhost:5000` with your server address if different)

---

## 1. CREATE Job Card
**POST** `/api/job-cards`

### Headers:
```
Content-Type: application/json
```

### Body (raw JSON):
```json
{
  "rfeNo": "RFE001",
  "jobCardNo": "ZAM-J000069",
  "regNo": "DSJD444",
  "invoiceNo": "ZAM-I00054",
  "serviceType": "Running Repair",
  "vehicle": "TATA NANO",
  "status": "Pending",
  "customerName": "John Doe",
  "mobileNo": "9876543210",
  "arrivalDate": "2025-07-04",
  "arrivalTime": "11:43",
  "notes": "Front brake issue"
}
```

### Required Fields:
- `jobCardNo`
- `regNo`
- `vehicle`
- `customerName`
- `mobileNo`
- `arrivalDate` (format: YYYY-MM-DD)
- `arrivalTime` (format: HH:mm)

### Expected Response (201 Created):
```json
{
  "success": true,
  "message": "Job card created successfully",
  "jobCard": {
    "_id": "...",
    "jobCardNo": "ZAM-J000069",
    "regNo": "DSJD444",
    ...
  }
}
```

---

## 2. GET All Job Cards
**GET** `/api/job-cards`

### Query Parameters (Optional):
- `status` - Filter by status (e.g., `Pending`, `Delivered`, `Invoice`)
- `regNo` - Search by registration number (partial match)
- `customerName` - Search by customer name (partial match)
- `startDate` - Filter from date (format: YYYY-MM-DD)
- `endDate` - Filter to date (format: YYYY-MM-DD)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Examples:

**Get all job cards:**
```
GET /api/job-cards
```

**Filter by status:**
```
GET /api/job-cards?status=Delivered
```

**Filter by registration number:**
```
GET /api/job-cards?regNo=DSJD
```

**Filter by date range:**
```
GET /api/job-cards?startDate=2025-07-01&endDate=2025-07-31
```

**With pagination:**
```
GET /api/job-cards?page=1&limit=20
```

**Combined filters:**
```
GET /api/job-cards?status=Invoice&customerName=John&page=1&limit=10
```

### Expected Response (200 OK):
```json
{
  "success": true,
  "jobCards": [
    {
      "_id": "...",
      "jobCardNo": "ZAM-J000069",
      "regNo": "DSJD444",
      ...
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

---

## 3. GET Job Card by ID
**GET** `/api/job-cards/:id`

### Example:
```
GET /api/job-cards/507f1f77bcf86cd799439011
```
(Replace with actual MongoDB ObjectId)

### Expected Response (200 OK):
```json
{
  "success": true,
  "jobCard": {
    "_id": "507f1f77bcf86cd799439011",
    "jobCardNo": "ZAM-J000069",
    ...
  }
}
```

---

## 4. GET Job Card by Job Card Number
**GET** `/api/job-cards/job-card-no/:jobCardNo`

### Example:
```
GET /api/job-cards/job-card-no/ZAM-J000069
```

### Expected Response (200 OK):
```json
{
  "success": true,
  "jobCard": {
    "_id": "...",
    "jobCardNo": "ZAM-J000069",
    ...
  }
}
```

---

## 5. UPDATE Job Card
**PUT** `/api/job-cards/:id`

### Headers:
```
Content-Type: application/json
```

### Body (raw JSON):
```json
{
  "status": "Delivered",
  "invoiceNo": "ZAM-I00055",
  "serviceType": "Full Service",
  "notes": "Completed successfully"
}
```
(Only include fields you want to update)

### Example:
```
PUT /api/job-cards/507f1f77bcf86cd799439011
```

### Expected Response (200 OK):
```json
{
  "success": true,
  "message": "Job card updated successfully",
  "jobCard": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "Delivered",
    ...
  }
}
```

---

## 6. DELETE Job Card
**DELETE** `/api/job-cards/:id`

### Example:
```
DELETE /api/job-cards/507f1f77bcf86cd799439011
```

### Expected Response (200 OK):
```json
{
  "success": true,
  "message": "Job card deleted successfully"
}
```

---

## Status Values
Valid status values:
- `Pending`
- `In Progress`
- `Invoice`
- `Delivered`
- `Cancelled`

---

## Common Error Responses

### 400 Bad Request (Missing required fields):
```json
{
  "success": false,
  "message": "Required fields: jobCardNo, regNo, vehicle, customerName, mobileNo, arrivalDate, arrivalTime"
}
```

### 400 Bad Request (Duplicate job card number):
```json
{
  "success": false,
  "message": "Job Card No. already exists"
}
```

### 404 Not Found:
```json
{
  "success": false,
  "message": "Job card not found"
}
```

### 500 Internal Server Error:
```json
{
  "success": false,
  "message": "Failed to create job card",
  "error": "Error details..."
}
```

---

## Quick Test Sequence

1. **Create** a new job card using POST
2. **Get all** job cards to see your created card
3. **Get by ID** using the `_id` from step 1
4. **Update** the job card using PUT
5. **Delete** the job card using DELETE

---

## Postman Collection Setup Tips

1. Create a new Collection: "Job Cards API"
2. Set Collection Variables:
   - `base_url` = `http://localhost:5000`
   - `job_card_id` = (will be set from responses)
3. Use Environment Variables for different servers (dev, staging, production)
4. Add Tests in Postman to save `job_card_id` from create response:
   ```javascript
   if (pm.response.code === 201) {
       const jsonData = pm.response.json();
       pm.collectionVariables.set("job_card_id", jsonData.jobCard._id);
   }
   ```
