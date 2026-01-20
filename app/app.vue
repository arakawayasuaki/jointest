<template>
  <div class="container">
    <h1>Natural Language SQL Analyzer</h1>
    
    <div class="actions">
      <button @click="initData" :disabled="loading" class="btn secondary">
        {{ loading ? 'Initializing...' : '1. Reset/Initialize Data' }}
      </button>
      <span v-if="initStatus" class="status">{{ initStatus }}</span>
    </div>

    <div class="card">
      <h2>Query</h2>
      <p class="hint">Example: "A店で2026年1月に撮影した画像で、XXサイズでプリントして出荷した総数を出して"</p>
      <textarea 
        v-model="prompt" 
        rows="4" 
        placeholder="Enter your request in natural language..."
      ></textarea>
      
      <div class="actions">
        <button @click="runQuery" :disabled="loading || !prompt" class="btn primary">
          {{ loading ? 'Processing...' : '2. Run Analysis' }}
        </button>
      </div>
    </div>

    <div v-if="result" class="card result-section">
      <h3>Analysis Result</h3>
      
      <div class="sql-box">
        <h4>Generated SQL:</h4>
        <code>{{ result.sql }}</code>
      </div>

      <div class="table-container" v-if="result.result">
        <h4>Data:</h4>
        <table v-if="Array.isArray(result.result) && result.result.length">
          <thead>
            <tr>
              <th v-for="key in Object.keys(result.result[0])" :key="key">{{ key }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in result.result" :key="idx">
              <td v-for="key in Object.keys(row)" :key="key">{{ row[key] }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else-if="result.error" class="error">Error: {{ result.error }}</p>
        <p v-else>No results found.</p>
      </div>
    </div>

    <!-- Raw Data Section -->
    <div class="card">
        <div class="header-actions">
            <h2>Current Mock Data (Redis)</h2>
            <button @click="fetchRawData" class="btn secondary small">Refresh Data</button>
        </div>
        
        <div v-if="rawData && rawData.data">
            <div v-for="(rows, tableName) in rawData.data" :key="tableName" class="mb-4">
                <h3>Table: {{ tableName }}</h3>
                <div class="table-container">
                    <table v-if="rows.length">
                        <thead>
                            <tr>
                                <th v-for="key in Object.keys(rows[0])" :key="key">{{ key }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, idx) in rows" :key="idx">
                                <td v-for="key in Object.keys(row)" :key="key">{{ row[key] }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <p v-else>No data in table.</p>
                </div>
            </div>
        </div>
        <p v-else class="hint">Click refresh to see data...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const prompt = ref('A店で2026年1月に撮影した画像で、XXサイズでプリントして出荷した総数を出して');
const loading = ref(false);
const initStatus = ref('');
const result = ref<any>(null);
const rawData = ref<any>(null);

const initData = async () => {
    loading.value = true;
    initStatus.value = '';
    result.value = null;
    try {
        const res = await $fetch('/api/init', { method: 'POST' });
        initStatus.value = 'Data Initialized in Redis!';
        // Auto refresh data if previously loaded or just because
        fetchRawData(); 
    } catch (e) {
        initStatus.value = 'Failed to init data';
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const runQuery = async () => {
    loading.value = true;
    result.value = null;
    try {
        const res = await $fetch('/api/ask', {
            method: 'POST',
            body: { prompt: prompt.value }
        });
        result.value = res;
    } catch (e) {
        console.error(e);
        result.value = { error: 'Failed to run query' };
    } finally {
        loading.value = false;
    }
};

const fetchRawData = async () => {
    try {
        rawData.value = await $fetch('/api/data');
    } catch (e) {
        console.error("Failed to fetch raw data", e);
    }
}
</script>

<style>
:root {
  --primary: #00dc82;
  --dark: #0f172a;
  --light: #f8fafc;
  --border: #e2e8f0;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--light);
    color: var(--dark);
    margin: 0;
    padding: 20px;
}

.container {
    max-width: 800px;
    margin: 0 auto;
}

h1 { color: var(--dark); text-align: center; margin-bottom: 40px; }
h2 { margin-top: 0; margin-bottom: 10px; }

.card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    margin-bottom: 20px;
}

.header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
    margin: 10px 0;
}

.hint {
    color: #64748b;
    font-size: 0.9em;
    margin-bottom: 10px;
}

.actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    transition: opacity 0.2s;
}
.btn.small {
    padding: 5px 10px;
    font-size: 0.9em;
}
.btn:hover { opacity: 0.9; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.primary { background-color: var(--primary); color: white; }
.secondary { background-color: #334155; color: white; }

.status { color: var(--primary); font-weight: bold; }

.sql-box {
    background: #1e293b;
    color: #a5b4fc;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 20px;
    overflow-x: auto;
}

.table-container {
    overflow-x: auto;
    margin-bottom: 20px;
}
.mb-4 { margin-bottom: 20px; }

table {
    width: 100%;
    border-collapse: collapse;
}

th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--border);
}

th {
    background-color: #f1f5f9;
    font-weight: 600;
}
.error { color: #ef4444; }
</style>
