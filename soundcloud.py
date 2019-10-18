# Created on 2019-07-21
# Author: Yuanda
# Version: 0.1
# Title: SoundCloud

# 注意⚠️
# 录音文件必须 >= 4 个

import os
import json
import sklearn
import librosa
import numpy as np
import matplotlib.pyplot as plt
from clustering import get_scaled_umap_embeddings, get_scaled_pca_embeddings

np.random.seed(8)


def get_file_paths(directory):
    files_paths = []
    files = os.listdir(directory)
    files = [i for i in files if i[-4:] == '.wav']
    files.sort()
    files.sort(key=lambda x: int(x[:-4]))
    print("All WAV file paths sorted by file names: \n", files)

    for file in files:
        file_path = os.path.join(directory, file)
        files_paths.append(file_path)

    return files_paths


def get_file_names(directory):
    file_names = []
    names = os.listdir(directory)
    names = [i for i in names if i[-4:] == '.wav']
    names.sort()
    names.sort(key=lambda x: int(x[:-4]))

    for name in names:
        file_names.append(name[:-4])
    print("All WAV files name sorted by file names: \n", file_names)

    return file_names


def get_mfcc_features(files_paths, sample_rate=44100, mfcc_size=13):
    # 提取MFCC特征，高保真压缩音频至numpy数组
    dataset = []
    print("Extracting MFCC features from raw audio files...")

    for file in files_paths:
        data, _ = librosa.load(file)  # mp3 file -> PCM audio data
        trimmed_data, _ = librosa.effects.trim(y=data)  # Trim the beginning and ending silence
        mfccs = librosa.feature.mfcc(trimmed_data,  # feature extraction by MFCCs
                                     sample_rate,
                                     n_mfcc=mfcc_size)
        # 特征预处理
        stddev_mfccs = np.std(mfccs, axis=1)
        mean_mfccs = np.mean(mfccs, axis=1)
        average_difference = np.zeros((mfcc_size,))

        for i in range(0, len(mfccs.T) - 2, 2):
            average_difference += mfccs.T[i] - mfccs.T[i + 1]
        average_difference /= (len(mfccs) // 2)
        average_difference = np.array(average_difference)

        concat_features = np.hstack((stddev_mfccs, mean_mfccs))
        concat_features = np.hstack((concat_features, average_difference))

        dataset.append(concat_features)

    mfcc_features = np.nan_to_num(np.array(dataset))

    return mfcc_features


# K-Means
def kmeans(features, n_clusters):
    kmeans = sklearn.cluster.KMeans(n_clusters=n_clusters, max_iter=1000000)
    kmeans.fit(features)
    kmeans_result = kmeans.predict(features)

    return kmeans_result


# generate result dict
def json_result(filenames, features, cluster_result):
    result = dict()
    for i in range(len(filenames)):
        file_name = filenames[i]
        coordinate = features[i]
        cluster = cluster_result[i]
        result.update({file_name: {"cluster": cluster, "coord": coordinate}})

    return result


# generate result json files
def store(data, path):
    with open(path, 'w') as f:
        f.write(json.dumps(data, cls=MyEncoder))


# Convert numpy type to python
class MyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        else:
            return super(MyEncoder, self).default(obj)


def soundcloud(directory, n_clusters=4, distance=0.5, do_plot=False):
    '''
    directory: The directory of wav audio files.
    n_clusters: The number of K-Means clusters.
    distance: UMAP hyperparameter.
    do_plot: Whether plot the result.
    return: A dict containing files paths, umap features and clustering result.
    '''

    # ---------- Get audio file paths -----------
    file_paths = get_file_paths(directory)

    # ---------- Get audio file names -----------
    file_names = get_file_names(directory)

    # ---------- Extract UMAP-MFCC features from raw audio files -----------
    mfcc_features = get_mfcc_features(file_paths)
    print('shape of MFCC features: \n', mfcc_features.shape)
    # if len(file_names) < 10:
    #     print('PCA running...')
    #     reduction_features = get_scaled_pca_embeddings(mfcc_features)
    #     print('PCA Dimensionality Reduction Done!')
    # else:
    #     print('UMAP running...')
    #     reduction_features = get_scaled_umap_embeddings(mfcc_features,
    #                                         neighbour=int(len(file_paths) / 2),
    #                                         distance=distance)
    #     print('UMAP Dimensionality Reduction Done!')

    print('PCA running...')
    reduction_features = get_scaled_pca_embeddings(mfcc_features)
    print('PCA Dimensionality Reduction Done!')

    # ---------- K-means clustering  -----------
    if len(file_paths) < 4:
        n_clusters = 1
    cluster_result = kmeans(reduction_features, n_clusters=n_clusters)
    print('聚类个数为: ', n_clusters)

    # ---------- Plot K-means result  -----------
    if do_plot:
        plt.scatter(reduction_features[:, 0],
                    reduction_features[:, 1],
                    s=2)
        plt.show()

    # ---------- Print K-means result  -----------
    result_dict = dict()
    for i in range(len(cluster_result)):
        file_name = file_paths[i]
        cluster = cluster_result[i]
        result_dict.update({file_name: cluster})

    for c in range(n_clusters):
        print('----- cluster{} -----'.format(c))
        for num, key in enumerate(result_dict):
            value = list(result_dict.values())[num]
            if c == value:
                print(key, value)

    # ---------- Generate json files -----------
    # dict
    result = json_result(file_names, reduction_features, cluster_result)
    print('result: ', result)
    # JSON
    store(result, 'result.json')

    return result


if __name__ == '__main__':
    soundcloud(directory='./dataset', do_plot=True)