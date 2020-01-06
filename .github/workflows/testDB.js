class defaultVaule {
    constructor(fn) {
        if (typeof this.__proto__[fn] === 'function') {
            return this.__proto__[fn]();
        }
    }
    db() {
        return {
            name: 'myDB',
        }
    }
    list() {
        return {
            name: 'myList',
            keyPath: 'id',
            auto: false,
        }
    }
    idx() {
        return {
            name: 'myIndex',
            unique: false,
        }
    }
    save() {
        return {
            name: 'myList',
            type: 'readwrite'
        }
    }
}
class localDB {
    constructor(openRequest = {}, db = {}, objectStore = {}) {
        this.openRequest = openRequest;
        this.db = db;
        this.objectStore = objectStore;
        Object.getOwnPropertyNames(this.__proto__).map(fn => {
            if (this.__proto__[fn] === 'function') {
                this[fn] = this[fn].bind(this);
            }
        })
    }
    openDB(ops, version) {
        let db = Object.assign(new defaultVaule('db'), ops);
        this.openRequest = !!version ? window.indexedDB.open(db.name, version) : window.indexedDB.open(db.name);
    }
    onupgradeneeded() {
        const upgradeneed = new Promise((resolve, reject) => {
            this.openRequest.onupgradeneeded = (event) => {
                this.db = event.target.result;
                resolve(this);
            }
        })
        return upgradeneed;
    }
    onsuccess() {
        const success = new Promise((resolve, reject) => {
            this.openRequest.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this);
            }
        })
        return success;
    }
    createObjectStore(ops) {
        let list = Object.assign(new defaultVaule('list'), ops);
        const store = new Promise((resolve, reject) => {
            this.objectStore = this.db.createObjectStore(list.name, {
                keyPath: list.keyPath,
                autoIncrement: list.auto
            });
            resolve(this);
        })
        return store;
    }
    createIndex(ops, save) {
        const store = new Promise((resolve, reject) => {
            ops.map(data => {
                let o = Object.assign(new defaultVaule('idx'), data);
                this.objectStore.createIndex(o.name, o.name, {
                    unique: o.unique
                })
            })
            resolve(this);
        })
        return store;
    }
    saveData(type = {}, savedata) {
        let save = Object.assign(new defaultVaule('save'), type);
        const transAction = new Promise((resolve, reject) => {
            let preStore = this.objectStore = this.getObjectStore(save);
            preStore.transaction.oncomplete = (event) => {
                let f = 0;
                let store = this.objectStore = this.getObjectStore(save);
                savedata.map(data => {
                    let request = store.add(data);
                    request.onsuccess = (event) => {
                        // todo 
                    }
                    f++;
                })
                if (f == savedata.length) {
                    resolve(this);
                }
            }
        })
        return transAction;
    }
    getData(ops, name, value) {
        let store = this.getObjectStore(ops);
        let data = new Promise((resolve, reject) => {
            store.index(name).get(value).onsuccess = (event) => {
                event.target.result ? resolve(event.target.result) : resolve('暂无相关数据')
            }
        })
        return data;
    }
    getAllData(ops) {
        let store = this.getObjectStore(ops);
        let data = new Promise((resolve, reject) => {
            store.getAll().onsuccess = (event) => {
                event.target.result ? resolve(event.target.result) : resolve('暂无相关数据')
            };
        })
        return data;
    }
    deleteData(ops, name) { // 主键名
        let store = this.getObjectStore(ops);
        store.delete(name).onsuccess = (event) => {
            console.log(event);
            console.log(this);
        }
    }
    updateData(ops, attr, lastValue, newValue) {
        let store = this.getObjectStore(ops);
        let data = new Promise((resolve, reject) => {
            store.openCursor().onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value[attr] == lastValue) {
                        let updateData = cursor.value;
                        updateData[attr] = newValue;
                        let updateDataRequest = cursor.update(updateData)
                        updateDataRequest.onsuccess = () => {
                            resolve('更新完成');
                        };
                    }
                    cursor.continue();
                } else {
                    resolve('找不到指定的值');
                }
            }
        })
        return data;
    }
    getObjectStore(ops) {
        return this.db.transaction(ops.name, ops.type).objectStore(ops.name);
    }
    clear(ops) {
        let clear = new Promise((resolve, reject) => {
            this.getObjectStore(ops).clear();
            resolve(this);
        })
        return clear
    }
    deleteStore(name) {
        let store = new Promise((resolve, reject) => {
            console.log(this.db);
            this.db.deleteObjectStore(name);
            resolve(this);
        })
        return store;
    }
    updateDB() {
        let version = this.db.version;
        let name = this.db.name;
        let update = new Promise((resolve, reject) => {
            this.closeDB();
            this.openDB({
                name: name
            }, ++version);
            resolve(this);
        })
        return update;
    }
    closeDB() {
        this.db.close();
        this.objectStore = this.db = this.request = {};
    }
}
