# 🎓 Student Dropout Prediction System

> A comprehensive full-stack machine learning application designed to identify at-risk students and predict dropout likelihood using advanced predictive analytics and data science techniques.

![TypeScript](https://img.shields.io/badge/TypeScript-54.1%25-3178c6?style=flat-square)
![Jupyter Notebook](https://img.shields.io/badge/Jupyter%20Notebook-41.9%25-F37726?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.8%25-3776ab?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)

## 📋 Overview

The **Student Dropout Prediction System** is a data-driven solution that leverages machine learning to predict student dropout probability early in their academic journey. By analyzing patterns in student performance, financial status, and engagement metrics, this system enables educational institutions to implement timely interventions.

## ✨ Key Features

- 🤖 **Advanced ML Model** - Trained dropout prediction model with comprehensive evaluation metrics
- 📊 **Synthetic Data Generation** - Realistic dataset generation for model training and validation
- 🖥️ **Interactive Dashboard** - User-friendly web interface for predictions and analytics
- 📁 **Database Integration** - Prisma ORM for efficient data management
- 🔄 **Full-Stack Architecture** - Seamless integration between frontend, backend, and ML components
- 📈 **Real-time Analysis** - Instant prediction and reporting capabilities

## 📂 Project Structure

```
Dropout-Prediction-System/
├── 🔬 python-backend/          ⭐ Core ML Implementation
│   ├── Dropout prediction model
│   ├── Synthetic data generation scripts
│   ├── Training notebooks (Jupyter)
│   └── Evaluation & metrics analysis
│
├── 📊 csv/                      Dataset Management
│   ├── Student Details
│   ├── Fee Status
│   └── Grades Data
│
├── 🎨 app/                      Frontend Application
│   └── Interactive UI Components
│
├── 🌐 public/                   Static Assets
│   └── Application Resources
│
├── 🗄️ prisma/                   Database ORM
│   └── Schema & Migration Files
│
├── ⚙️ qr-backend/               Backend Services
│   └── Secondary API Endpoints
│
└── ⚡ Configuration Files
    ├── vite.config.ts
    ├── tsconfig.json
    ├── package.json
    └── wrangler.toml.example
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | TypeScript, Vite, React |
| **Backend** | Node.js, Express |
| **Database** | Prisma ORM |
| **ML/Data Science** | Python, Scikit-learn, Pandas, Jupyter |
| **Styling** | CSS |
| **Deployment** | Cloudflare Workers (Wrangler) |

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dhrupandey/Dropout-Prediction-System.git
   cd Dropout-Prediction-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Python backend**
   ```bash
   cd python-backend
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp wrangler.toml.example wrangler.toml
   # Edit wrangler.toml with your configuration
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

## 🧠 ML Model Details

### Core Components

- **Data Processing** - Comprehensive feature engineering and preprocessing
- **Model Training** - Scikit-learn based training with cross-validation
- **Evaluation Metrics** - Precision, Recall, F1-Score, ROC-AUC analysis
- **Synthetic Dataset** - Realistic data generation for robust model validation

### Notebooks & Analysis

Located in `python-backend/`, the Jupyter notebooks provide:
- Exploratory Data Analysis (EDA)
- Feature Engineering Walkthrough
- Model Training & Hyperparameter Tuning
- Performance Evaluation & Visualization

## 📖 Usage

### For Predictions
1. Navigate to the web dashboard
2. Input student information (grades, fees, engagement metrics)
3. Receive instant dropout risk assessment
4. View detailed recommendations

### For ML Development
1. Access `python-backend/` directory
2. Review Jupyter notebooks for model details
3. Run training scripts to retrain with new data
4. Update model evaluation metrics

## 📊 Model Performance

The system includes comprehensive evaluation:
- Cross-validation analysis
- Confusion matrix visualization
- Feature importance ranking
- ROC-AUC curves

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 📞 Contact & Support

- **Author**: [Dhrupandey](https://github.com/Dhrupandey)
- **Original Repository**: [Mayanksharma685/Dropout-Prediction-System](https://github.com/Mayanksharma685/Dropout-Prediction-System)


<div align="center">

**Made with ❤️ for Educational Excellence**

[⬆ Back to Top](#-student-dropout-prediction-system)

</div>
