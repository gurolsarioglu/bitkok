const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class ContentModel {
  constructor() {
    this.filePath = config.data.contentPath;
  }

  /** Tüm içeriği oku */
  getAll() {
    const raw = fs.readFileSync(this.filePath, 'utf-8');
    return JSON.parse(raw);
  }

  /** Tek bir bölümü oku */
  getSection(sectionName) {
    const data = this.getAll();
    return data[sectionName] || null;
  }

  /** Tek bir bölümü güncelle */
  updateSection(sectionName, newData) {
    const data = this.getAll();
    data[sectionName] = { ...data[sectionName], ...newData };
    this._save(data);
    return data[sectionName];
  }

  /** Bölüm içindeki bir alanı güncelle */
  updateField(sectionName, fieldName, value) {
    const data = this.getAll();
    if (!data[sectionName]) data[sectionName] = {};
    data[sectionName][fieldName] = value;
    this._save(data);
    return data[sectionName];
  }

  /** Dizi içindeki bir öğeyi güncelle (index ile) */
  updateArrayItem(sectionName, arrayField, index, newItem) {
    const data = this.getAll();
    if (data[sectionName] && Array.isArray(data[sectionName][arrayField])) {
      data[sectionName][arrayField][index] = {
        ...data[sectionName][arrayField][index],
        ...newItem
      };
      this._save(data);
    }
    return data[sectionName];
  }

  /** Diziye yeni öğe ekle */
  addArrayItem(sectionName, arrayField, newItem) {
    const data = this.getAll();
    if (data[sectionName] && Array.isArray(data[sectionName][arrayField])) {
      data[sectionName][arrayField].push(newItem);
      this._save(data);
    }
    return data[sectionName];
  }

  /** Diziden öğe sil */
  removeArrayItem(sectionName, arrayField, index) {
    const data = this.getAll();
    if (data[sectionName] && Array.isArray(data[sectionName][arrayField])) {
      data[sectionName][arrayField].splice(index, 1);
      this._save(data);
    }
    return data[sectionName];
  }

  /** JSON dosyasına kaydet */
  _save(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

module.exports = new ContentModel();
