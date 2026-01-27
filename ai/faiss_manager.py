import faiss
import os
import json
import numpy as np

class FaissManager:
    def __init__(self,
                 index_path="database/faiss.index",
                 meta_path="database/faiss_meta.json",
                 dim=512):

        self.index_path = index_path
        self.meta_path = meta_path
        self.dim = dim

        os.makedirs(os.path.dirname(index_path), exist_ok=True)

        if os.path.exists(index_path):
            self.index = faiss.read_index(index_path)
        else:
            self.index = faiss.IndexFlatIP(dim)

        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                self.meta = json.load(f)
        else:
            self.meta = {}

    def add(self, embedding, member_id):
        embedding = np.array(embedding).astype("float32").reshape(1, -1)
        faiss.normalize_L2(embedding)

        self.index.add(embedding)
        self.meta[str(self.index.ntotal - 1)] = member_id

    def save(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.meta_path, "w") as f:
            json.dump(self.meta, f)

    def search(self, embedding, top_k=1):
        embedding = np.array(embedding).astype("float32").reshape(1, -1)
        faiss.normalize_L2(embedding)

        distances, indices = self.index.search(embedding, top_k)

        results = []
        for i, score in zip(indices[0], distances[0]):
            if i == -1:
                continue
            member_id = self.meta.get(str(i))
            results.append((member_id, float(score)))

        return results
