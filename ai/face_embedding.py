import numpy as np

def get_embedding(face_object):
    """
    Converts InsightFace face → 512D vector
    """
    embedding = face_object.normed_embedding
    return np.array(embedding).astype("float32")
