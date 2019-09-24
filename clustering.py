import umap
from sklearn.preprocessing import MinMaxScaler
from sklearn.decomposition import PCA

# UMAP embeddings
def get_scaled_umap_embeddings(features, neighbour, distance):
    embedding = umap.UMAP(n_neighbors=neighbour,
                          min_dist=distance,
                          metric='correlation').fit_transform(features)
    scaler = MinMaxScaler()
    scaler.fit(embedding)

    return scaler.transform(embedding)

# PCA embeddings
def get_scaled_pca_embeddings(features):
    pca = PCA(n_components=2)
    embedding = pca.fit_transform(features)
    scaler = MinMaxScaler()
    scaler.fit(embedding)

    return scaler.transform(embedding)