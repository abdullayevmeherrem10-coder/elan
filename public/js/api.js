const API = {
  async get(url) {
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Xəta baş verdi' }));
      throw new Error(err.error);
    }
    return res.json();
  },

  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json;
  },

  async postForm(url, formData) {
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json;
  },

  async put(url, data) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json;
  },

  async putForm(url, formData) {
    const res = await fetch(url, {
      method: 'PUT',
      body: formData
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json;
  },

  async delete(url) {
    const res = await fetch(url, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json;
  }
};
