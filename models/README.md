# EchoTune AI Models Directory

This directory contains machine learning model artifacts and configurations for deployment to Google Cloud Vertex AI.

## Directory Structure

```
models/
├── sample-model/           # Sample model for demonstration and testing
│   ├── model.pkl          # Placeholder model artifact
│   ├── requirements.txt   # Python dependencies for the model
│   └── model_metadata.json # Model configuration and schema
└── README.md              # This file
```

## Model Deployment

Models in this directory are automatically deployed to Vertex AI when:
1. Changes are pushed to the `models/**` path
2. The `vertex-deploy` workflow is manually triggered
3. A PR is labeled with `vertex-deploy`

## Adding New Models

1. Create a new directory under `models/` with your model name
2. Add your model artifacts (pickle files, SavedModel directories, etc.)
3. Include a `requirements.txt` with Python dependencies
4. Add a `model_metadata.json` with model configuration
5. Commit and push your changes

## Model Metadata Format

Each model should include a `model_metadata.json` file with the following structure:

```json
{
  "name": "model-name",
  "version": "1.0.0", 
  "description": "Model description",
  "type": "model_type",
  "framework": "scikit-learn|tensorflow|pytorch|etc",
  "input_schema": {...},
  "output_schema": {...},
  "vertex_ai": {
    "machine_type": "n1-standard-4",
    "accelerator_type": null,
    "min_replica_count": 1,
    "max_replica_count": 3,
    "traffic_split": {"0": 100}
  }
}
```

## Vertex AI Configuration

The deployment process will:
1. Upload model artifacts to Google Cloud Storage
2. Create or update a Vertex AI Model
3. Create or reuse a Vertex AI Endpoint
4. Deploy the model to the endpoint
5. Surface the endpoint details back to the GitHub PR

## Testing Deployed Models

After deployment, you can test models using:
```bash
npm run vertex:test-model <model-name>
```

This will send a sample prediction request to the deployed endpoint and validate the response.