import numpy as np
from sklearn.decomposition import PCA
import joblib

# Load your sample embeddings (replace with your actual data source)
# For example, save your sample embeddings as 'sample_openai_embeddings.npy'
# sample_embeddings = np.load('sample_openai_embeddings.npy')

# For demonstration, we'll generate random data (replace this!):
sample_embeddings = np.random.rand(2000, 1536)  # 2000 samples, 1536 dims

print(f"Fitting PCA on shape: {sample_embeddings.shape}")
pca = PCA(n_components=1024)
pca.fit(sample_embeddings)

joblib.dump(pca, "pca_1536_to_1024.joblib")
print("PCA model saved as pca_1536_to_1024.joblib") 