import faiss
import os
import numpy as np

FAISS_PATH = "database/faiss.index"
DIMENSION = 512


class FaissManager:

    def __init__(self):
        if os.path.exists(FAISS_PATH):
            self.index = faiss.read_index(FAISS_PATH)
        else:
            base = faiss.IndexFlatL2(DIMENSION)
            self.index = faiss.IndexIDMap(base)

        if not os.path.exists("database"):
            os.makedirs("database")


    def add(self, embedding, member_id):
        self.index.add_with_ids(
            np.array([embedding]).astype("float32"),
            np.array([member_id]).astype("int64")
        )

    def search(self, embedding):
        if self.index.ntotal == 0:
            return None, None

        D, I = self.index.search(
            np.array([embedding]).astype("float32"), 1
        )

        if I[0][0] == -1:
            return None, None

        return int(I[0][0]), float(D[0][0])

    def save(self):
        faiss.write_index(self.index, FAISS_PATH)
