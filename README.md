# 🐺 Volkrin Stream – Backend

Volkrin Stream is a **portfolio + practice project** designed to simulate a cloud-native media streaming platform.  
It is **not a production application** — it’s built to **practice DevOps concepts** such as containerization, caching, monitoring, deployment, and scaling.

Learners and engineers can use this backend to experiment with **DevOps pipelines, AWS infra, and observability tools**.  
The frontend is kept private, but you are free to **build your own frontend** on top of this API.

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)
![Redis](https://img.shields.io/badge/Redis-Cache-red)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)


---

## 🌍 Project Overview

- **Authentication & RBAC** → JWT-based auth, with role separation (user/admin).  
- **Tracks Management** → Upload, list, stream (via S3), and delete tracks.  
- **Caching Layer** → Redis (local + Upstash) for faster responses and reduced DB load.  
- **Storage** → AWS S3 for audio + thumbnails.  
- **Database** → MongoDB Atlas.  
- **Monitoring** → Prometheus metrics (signups, logins, track uploads, cache hits/misses).  
- **Deployment Ready** → Dockerized, suitable for AWS EC2/ECS/Kubernetes.  

---

## 🛠 Tech Stack

### Backend
- Node.js + Express
- MongoDB Atlas (database)
- AWS S3 (media storage)
- Redis (local + Upstash for caching)
- Prometheus + Grafana (metrics)
- Docker (containerization)

### Infrastructure
- AWS EC2 + ALB (backend hosting, scaling)
- AWS S3 + CloudFront (frontend hosting, CDN) *(frontend not public here)*
- AWS CodePipeline (CI/CD)
- Environment variables via `.env` use aws secrets manager in production.

---

## 📂 Features

### 🔑 Auth
- Signup (with role option: user/admin).
- Login (returns JWT token).
- Profile endpoint (`/me`).
- Admin signup protected by **admin secret**.

### 🎵 Tracks
- **Upload** → Audio + Thumbnail (admin only).
- **List** → Returns all tracks (cached in Redis).
- **Stream** → Returns signed S3 URL (expires in 5 min).
- **Delete** → Admin-only, invalidates Redis cache.

### 📊 Monitoring
- Prometheus metrics:
  - `volkrin_signups_total`
  - `volkrin_logins_total`
  - `volkrin_failed_logins_total`
  - `volkrin_track_uploads_total`
  - `volkrin_track_deletions_total`
  - `volkrin_user_deletions_total`
  - `volkrin_cache_hits_total`
  - `volkrin_cache_misses_total`

### 🔧 Utilities
- Health check endpoint (`/api/health`)
- Morgan logs (request logging)
- Dockerized backend

---

## ⚙️ Setup

### 1. Clone repo
```bash
git clone url of this repository 
cd volkrin-stream-backend
```
### 2. Install dependencies

```
npm install
```
### 3. Configure .env

Create backend/.env with:

```
PORT=8000
MONGO_URI=mongodb+srv://<your-atlas-uri>
JWT_SECRET=supersecretjwt
ADMIN_SECRET=supersecretadmin

AWS_REGION=ap-south-1
S3_BUCKET=s3bucketname
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Redis (choose local OR Upstash)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
UPSTASH_REDIS_URL=rediss://...

```
### To make things work as i did with aws

Create a IAM user for application purpose do not provide console access.
attach this below inline policy and create access key to use in .env file.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::yourbucketname",
                "arn:aws:s3:::yourbucketname/*"
            ]
        }
    ]
}

```
**This will ensure to have least privilage(access only to specific s3 bucket you create)**

#### ⚠️ For storage bucket policy 

Disable block public access and add the below bucket policy. (⚠️ Don't use it in production or MVP) Keep private.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ReadAccessForAll",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::bucketname/*"
        },
        {
            "Sid": "AdminUploadAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::your id:userbucketname/"
            },
            "Action": [
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::bucketname",
                "arn:aws:s3:::bucketname/*"
            ]
        }
    ]
}

```



### 4. Run locally

```
npm run dev
```

### 5. Docker

```
docker build -t volkrin-stream-backend .
docker run -p 8000:8000 volkrin-stream-backend

```
### 🔗 API Endpoints
#### Auth

| Method | Endpoint           | Description                               | Auth |
| ------ | ------------------ | ----------------------------------------- | ---- |
| POST   | `/api/auth/signup` | Signup user/admin (admin requires secret) | ❌    |
| POST   | `/api/auth/login`  | Login, returns JWT                        | ❌    |
| GET    | `/api/auth/me`     | Get profile                               | ✅    |

#### Users (Admin Only)

| Method | Endpoint              | Description       |
| ------ | --------------------- | ----------------- |
| GET    | `/api/auth/users`     | List all users    |
| DELETE | `/api/auth/users/:id` | Delete user by ID |

#### Tracks

| Method | Endpoint                 | Description              | Auth  |
| ------ | ------------------------ | ------------------------ | ----- |
| POST   | `/api/tracks/upload`     | Upload audio + thumbnail | Admin |
| GET    | `/api/tracks/`           | List all tracks          | ❌     |
| GET    | `/api/tracks/:id/stream` | Get signed stream URL    | ❌     |
| DELETE | `/api/tracks/:id`        | Delete track             | Admin |

#### Other

| Method | Endpoint      | Description        |
| ------ | ------------- | ------------------ |
| GET    | `/api/health` | Health check       |
| GET    | `/metrics`    | Prometheus metrics |

---

### 📊 Observability

  - Metrics exposed at `/metrics` in Prometheus format.
  - Integrates with Grafana dashboards.
  - Custom counters for signups, logins, track uploads, deletions, cache usage.
  - Morgan logs → can be exported to CloudWatch.

---

### ⚠️ Known Limitations (Deliberate Trade-offs)

This project is not production-ready. Flaws are left intentionally unfixed to focus on DevOps concepts rather than backend perfection:
- **Public S3 Access**: Media files are directly accessible.  
    _Fix in prod_: Use a private bucket and presigned URLs.

- **Wide-Open CORS (dev mode)**: Allows all origins.  
    _Fix in prod_: Restrict to portfolio domains (e.g., volkrin.com).

- **No Rate Limiting**: Login/signup brute-force possible.  
    _Fix in prod_: Add Redis-backed rate limiting.

- **In-Memory Uploads**: Multer stores files in memory.  
    _Fix in prod_: Stream uploads directly to S3 (multipart upload).

- **Secrets in .env**: Environment variables are stored locally.  
    _Fix in prod_: Use AWS Secrets Manager.

- **HTTPS Enforcement**: Not forced locally.  
    _Fix in prod_: Enforce TLS via ALB/CloudFront.

⚠️ Note: /metrics endpoint is public in this project for learning purposes. In production, protect it with authentication, IP whitelisting, or run Prometheus in a private network.

Protect /metrics (recommended for production)

You can wrap it with auth + isAdmin middleware:

// backend/src/app.js
```
const auth = require("./middleware/auth");
const isAdmin = require("./middleware/isAdmin");

const metricsMiddleware = promBundle({ includeMethod: true, includePath: true });

// Protect /metrics so only admin users can access
app.use("/metrics", auth, isAdmin, metricsMiddleware);

```

🔑 Now only logged-in admins with JWT can fetch /metrics.

Or, even simpler → restrict by IP:
```
app.use("/metrics", (req, res, next) => {
  if (req.ip !== "127.0.0.1") {
    return res.status(403).send("Forbidden");
  }
  next();
}, metricsMiddleware);
```

These trade-offs are intentional → the project is for DevOps practice (deployment, monitoring, scaling, caching), not as a production streaming service.

---

### 📖 Learning Use-Cases

This backend is ideal for learners who want to practice:

✅ Dockerization of Node.js apps

✅ AWS EC2 + ALB deployment

✅ S3 + CloudFront integration

✅ MongoDB Atlas + Redis caching

✅ Prometheus + Grafana monitoring

✅ JWT auth & RBAC security basics

✅ CI/CD pipelines (CodePipeline, GitHub Actions, Jenkins)

---

### 📜 License

This project is released under the **MIT License**.

**✅ What You Can Do**

- Use this codebase for personal learning, experimentation, and portfolio projects.
- Modify and extend the backend to suit your own requirements (e.g., build a custom frontend).
- Share your modified versions, provided you give proper attribution.
- Deploy the backend to cloud platforms for testing, demonstrations, or proof-of-concept scenarios.

---

**🚫 What You Cannot Do**

- Use this backend in production environments without addressing its security and reliability limitations.
- Present this project as your own original work without crediting the author.
- Hold the creator(s) responsible for any issues, damages, or vulnerabilities resulting from use.

---

**⚠️ Disclaimer**

This project is for educational and demonstration purposes only:

- It is not intended for production use and contains deliberate limitations.
- Security flaws and trade-offs are present to illustrate DevOps concepts.
- No warranties are provided—use at your own risk.

Refer to the LICENSE file for the complete legal terms.

---

**🙌 Attribution**

This backend project was created by **Chandru Subramani**

as part of the **Volkrin portfolio** series to practice and showcase DevOps concepts.

If you reuse or adapt this project for learning or your own portfolio,
please provide attribution by linking back to this repository or to **volkrin.com**.

🐺 **Volkrin** stands for **resilience, loyalty, and adaptability** — values carried into this project.


**--See you Volkrin**