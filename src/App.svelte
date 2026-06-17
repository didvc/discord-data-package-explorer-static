<script>
  import { onMount } from 'svelte';
  import { Unzip, AsyncUnzipInflate, DecodeUTF8 } from 'fflate';
  import Papa from 'papaparse';

  // State
  let fileName = '';
  let loading = false;
  let progress = '';
  let error = '';
  let data = null; // { user, channels: [{id, name, guild?, isDM, messages: [...] }], ... aggregates }

  let currentTab = 'search'; // 'overview' | 'search' | 'activity'

  // Search state
  let searchQuery = '';
  let filterType = 'all'; // all | dm | guild
  let filterChannel = '';
  let sortMode = 'newest'; // newest | oldest
  let searchResults = [];
  let searchLimit = 200;

  // Demo data flag
  let isDemo = false;

  function reset() {
    data = null;
    fileName = '';
    error = '';
    progress = '';
    searchQuery = '';
    searchResults = [];
    isDemo = false;
  }

  // Helpers
  function getCreatedTimestamp(id) {
    const EPOCH = 1420070400000;
    return id / 4194304 + EPOCH;
  }

  function formatDate(ts) {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  }

  // Full featured message parser (keeps content unlike original stripped version)
  function parseMessages(raw, extension) {
    if (extension === 'csv') {
      const parsed = Papa.parse(raw, { header: true, newline: ',\r' });
      return parsed.data
        .filter((m) => m.Contents && m.Contents.trim())
        .map((m) => ({
          id: m.ID,
          timestamp: m.Timestamp,
          content: m.Contents,
          attachments: m.Attachments || ''
        }));
    } else {
      // JSON format (newer)
      let arr;
      try {
        arr = JSON.parse(raw);
      } catch (e) {
        console.warn('Failed to parse messages JSON');
        return [];
      }
      return arr
        .filter((m) => m.Contents && m.Contents.trim && m.Contents.trim())
        .map((m) => ({
          id: m.ID,
          timestamp: m.Timestamp,
          content: m.Contents,
          attachments: (m.Attachments || []).join(', ')
        }));
    }
  }

  // Core extraction - adapted for full messages + static (no network)
  async function extractPackage(files) {
    const extracted = {
      user: null,
      channels: [],
      totalMessages: 0,
      totalCharacters: 0,
      dmCount: 0,
      guildCount: 0,
      topGuilds: [],
      hours: new Array(24).fill(0),
      favoriteWords: [],
    };

    const getFile = (name) => files.find((f) => f.name === name);

    const readFileText = (name) => {
      return new Promise((resolve) => {
        const file = getFile(name);
        if (!file) return resolve(null);
        const chunks = [];
        const decoder = new DecodeUTF8();
        file.ondata = (_e, data, final) => {
          decoder.push(data, final);
        };
        decoder.ondata = (str, final) => {
          chunks.push(str);
          if (final) resolve(chunks.join(''));
        };
        file.start();
      });
    };

    // Detect roots
    const sampleMsg = files.find((f) => /\/c?[0-9]{16,32}\/channel\.json$/.test(f.name));
    if (!sampleMsg) throw new Error('No messages folder detected. Make sure you uploaded a valid package.zip');

    const msgSegments = sampleMsg.name.split('/');
    const messagesRoot = msgSegments.slice(0, msgSegments.length - 2).join('/');

    const userSample = files.find((f) => /^[^/]+\/user\.json$/.test(f.name));
    if (!userSample) throw new Error('Missing account/user.json. Re-request your data package including Account Info + Messages.');
    const accountRoot = userSample.name.split('/').slice(0, -1).join('/');

    // Load user
    progress = 'Reading account info...';
    const userJson = await readFileText(`${accountRoot}/user.json`);
    if (userJson) {
      extracted.user = JSON.parse(userJson);
    }

    // messages index
    progress = 'Reading message index...';
    const indexRaw = await readFileText(`${messagesRoot}/index.json`);
    const channelNameMap = indexRaw ? JSON.parse(indexRaw) : {};

    // Detect old vs new package format
    const hasLeadingC = files.some((f) => /\/c[0-9]{16,32}\/channel\.json$/.test(f.name));
    const hasJsonMessages = files.some((f) => /\/messages\.json$/.test(f.name));
    const isOldV1 = !hasLeadingC; // pre 2021-ish
    const isCsv = !hasJsonMessages;

    progress = 'Scanning channels...';

    // Find all channel folders
    const channelDirRegex = new RegExp(`^${messagesRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(c?)([0-9]{16,32})/$`);
    const channelFolders = files.filter((f) => channelDirRegex.test(f.name));

    const channelIds = channelFolders.map((f) => {
      const m = f.name.match(channelDirRegex);
      return m[2];
    });

    let processed = 0;
    const total = channelIds.length;

    // Process channels (limit concurrency a bit for browser)
    for (let i = 0; i < channelIds.length; i += 6) {
      const batch = channelIds.slice(i, i + 6);
      await Promise.all(
        batch.map(async (cid) => {
          const prefix = hasLeadingC ? 'c' : '';
          const chJsonPath = `${messagesRoot}/${prefix}${cid}/channel.json`;
          const msgExt = isCsv ? 'csv' : 'json';
          const msgPath = `${messagesRoot}/${prefix}${cid}/messages.${msgExt}`;

          const [chRaw, msgRaw] = await Promise.all([
            readFileText(chJsonPath),
            readFileText(msgPath),
          ]);

          if (!chRaw || !msgRaw) return;

          let chData;
          try {
            chData = JSON.parse(chRaw);
          } catch {
            return;
          }

          const messages = parseMessages(msgRaw, msgExt);

          const nameFromIndex = channelNameMap[chData.id] || chData.name || 'Unknown Channel';
          const isDM = !!(chData.recipients && chData.recipients.length === 2);
          const guildName = chData.guild ? chData.guild.name : null;

          extracted.channels.push({
            id: chData.id,
            name: nameFromIndex,
            guildName,
            isDM,
            type: isDM ? 'DM' : (guildName ? 'Server' : 'Group'),
            messages,
          });

          processed++;
          if (processed % 8 === 0) {
            progress = `Parsing messages... ${processed}/${total} channels`;
          }
        })
      );
    }

    // Compute aggregates
    progress = 'Calculating stats...';

    let totalMsgs = 0;
    let totalChars = 0;
    const wordCounts = {};
    const guildMsgCount = {};

    extracted.channels.forEach((ch) => {
      totalMsgs += ch.messages.length;

      ch.messages.forEach((m) => {
        if (m.content) {
          totalChars += m.content.length;
          const words = m.content.toLowerCase().match(/\b\w{5,}\b/g) || [];
          words.forEach((w) => {
            wordCounts[w] = (wordCounts[w] || 0) + 1;
          });
        }
        const hour = new Date(m.timestamp).getHours();
        if (!isNaN(hour)) extracted.hours[hour]++;

        if (ch.guildName) {
          guildMsgCount[ch.guildName] = (guildMsgCount[ch.guildName] || 0) + 1;
        }
      });
    });

    extracted.totalMessages = totalMsgs;
    extracted.totalCharacters = totalChars;

    extracted.dmCount = extracted.channels.filter((c) => c.isDM).length;
    extracted.guildCount = new Set(
      extracted.channels.filter((c) => c.guildName).map((c) => c.guildName)
    ).size;

    // Top servers by message count
    extracted.topGuilds = Object.entries(guildMsgCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // Favorite words
    extracted.favoriteWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([word, count]) => ({ word, count }));

    if (!extracted.user) {
      extracted.user = { username: 'You', discriminator: '0000', id: '0' };
    }

    progress = '';
    return extracted;
  }

  // Handle uploaded file (zip)
  async function handleFile(file) {
    if (!file) return;
    reset();
    loading = true;
    fileName = file.name;
    error = '';
    progress = 'Unzipping package... (this can take time for large exports)';

    try {
      const uz = new Unzip();
      uz.register(AsyncUnzipInflate);

      const fileList = [];
      uz.onfile = (f) => fileList.push(f);

      if (!file.stream) {
        throw new Error('Your browser does not support streaming file reads. Please use a recent Chrome/Firefox/Edge.');
      }

      const reader = file.stream().getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          uz.push(new Uint8Array(0), true);
          break;
        }
        for (let i = 0; i < value.length; i += 65536) {
          uz.push(value.subarray(i, i + 65536));
        }
      }

      // Basic sanity checks
      const hasUser = fileList.some((f) => /^[^/]+\/user\.json$/.test(f.name));
      const hasChannel = fileList.some((f) => /\/c?[0-9]{16,32}\/channel\.json$/.test(f.name));

      if (fileList.some((f) => f.name.startsWith('package/'))) {
        throw new Error('You appear to have zipped the inner "package" folder. Open the extracted folder, select everything inside it, and zip those files directly.');
      }
      if (!hasUser || !hasChannel) {
        throw new Error('This does not look like a valid Discord data package. Make sure it is the original package.zip (not an extracted folder that was re-zipped). Include Messages + Account info.');
      }

      const extracted = await extractPackage(fileList);
      data = extracted;

      // Initial search results = recent messages
      updateSearchResults();

      currentTab = 'search';
    } catch (e) {
      console.error(e);
      error = e.message || 'Failed to process the package. See console for details.';
    } finally {
      loading = false;
      progress = '';
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function onFileInput(e) {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = ''; // allow reselect same file
  }

  // DEMO data - small self contained sample
  function loadDemo() {
    reset();
    isDemo = true;
    fileName = 'demo-package.zip';

    const now = new Date();
    const sampleMessages = (count, baseContent, guild, chName, isDM) => {
      const arr = [];
      for (let i = 0; i < count; i++) {
        const dt = new Date(now.getTime() - i * 1000 * 60 * 60 * (1 + Math.random()));
        arr.push({
          id: String(1000000000000000000 + i),
          timestamp: dt.toISOString(),
          content: baseContent + (i % 3 === 0 ? ' hello world testing search feature here' : ''),
          attachments: ''
        });
      }
      return arr;
    };

    data = {
      user: { username: 'DemoUser', discriminator: '1234', id: '123456789012345678' },
      channels: [
        {
          id: '111',
          name: 'general',
          guildName: 'My Cool Server',
          isDM: false,
          type: 'Server',
          messages: sampleMessages(42, 'This is a message in general ', 'My Cool Server', 'general', false)
        },
        {
          id: '222',
          name: 'offtopic',
          guildName: 'My Cool Server',
          isDM: false,
          type: 'Server',
          messages: sampleMessages(27, 'Random offtopic chat ', 'My Cool Server', 'offtopic', false)
        },
        {
          id: '333',
          name: 'DM with friend',
          guildName: null,
          isDM: true,
          type: 'DM',
          messages: sampleMessages(18, 'Hey what are you up to? ', null, null, true)
        },
        {
          id: '444',
          name: 'another-guild',
          guildName: 'Other Community',
          isDM: false,
          type: 'Server',
          messages: sampleMessages(15, 'Cross server test message for search ', 'Other Community', 'general', false)
        }
      ],
      totalMessages: 102,
      totalCharacters: 4200,
      dmCount: 1,
      guildCount: 2,
      topGuilds: [
        { name: 'My Cool Server', count: 69 },
        { name: 'Other Community', count: 15 }
      ],
      hours: [3,1,0,0,2,4,12,19,8,5,3,7,11,14,22,18,9,6,4,2,1,0,1,2],
      favoriteWords: [
        { word: 'message', count: 22 },
        { word: 'search', count: 11 },
        { word: 'discord', count: 9 }
      ]
    };

    updateSearchResults();
    currentTab = 'search';
  }

  // Search / filter logic - the reason for this tool
  function updateSearchResults() {
    if (!data || !data.channels) {
      searchResults = [];
      return;
    }

    let allMsgs = [];
    data.channels.forEach((ch) => {
      ch.messages.forEach((m) => {
        allMsgs.push({
          ...m,
          channelName: ch.name,
          guildName: ch.guildName || (ch.isDM ? 'DM' : 'Group DM'),
          channelType: ch.type
        });
      });
    });

    // Filter
    let filtered = allMsgs;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((m) =>
        (m.content || '').toLowerCase().includes(q)
      );
    }

    if (filterType === 'dm') {
      filtered = filtered.filter((m) => m.channelType === 'DM');
    } else if (filterType === 'guild') {
      filtered = filtered.filter((m) => m.channelType === 'Server');
    }

    if (filterChannel) {
      filtered = filtered.filter((m) => m.channelName.toLowerCase().includes(filterChannel.toLowerCase()));
    }

    // Sort
    filtered.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return sortMode === 'newest' ? tb - ta : ta - tb;
    });

    searchResults = filtered.slice(0, searchLimit);
  }

  // Reactive updates
  $: if (data) {
    updateSearchResults();
  }

  // Export current filtered results
  function exportResults() {
    if (!searchResults.length) return;

    const csvRows = ['timestamp,channel,guild,content'];
    searchResults.forEach((m) => {
      const safe = (m.content || '').replace(/"/g, '""');
      csvRows.push(`"${m.timestamp}","${m.channelName}","${m.guildName}","${safe}"`);
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discord-messages-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearData() {
    reset();
  }

  // Keyboard support
  onMount(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement.tagName === 'BODY') {
        e.preventDefault();
        const inp = document.getElementById('search-input');
        if (inp) inp.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const inp = document.getElementById('search-input');
        if (inp) inp.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<div class="app">
  <!-- Header -->
  <header>
    <div style="display:flex; align-items:center; gap:12px;">
      <div on:click={reset} on:keydown={(e) => e.key === 'Enter' && reset()} tabindex="0" role="button" style="outline:none; font-size:20px; font-weight:600; cursor:pointer">Discord Data Package Explorer</div>
      <span class="badge">STATIC</span>
    </div>
    <div>
      {#if data}
        <button on:click={clearData} style="background:#4f545c;color:white;border:none;padding:8px 14px;border-radius:6px;font-size:13px;">Clear Data</button>
      {/if}
    </div>
  </header>

  <!-- Transparency / Trust banner -->
  <div class="transparency">
    <strong>✓ Pure static • GitHub Pages • Zero telemetry • Zero backend</strong>
    — All processing happens locally in your browser. Your Discord data never leaves your device.
    <span style="opacity:.7"> • Press <kbd>/</kbd> or <kbd>⌘K</kbd> to focus search</span>
  </div>

  <div class="container">
    {#if !data}
      <!-- Loader / Upload -->
      <div class="dropzone" role="button" tabindex="0"
           on:drop={handleDrop}
           on:dragover={handleDragOver}
           on:dragenter={handleDragOver}
           on:click={() => document.getElementById('file-input').click()}
           on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && document.getElementById('file-input').click()}>
        <div style="font-size:48px;opacity:0.9;margin-bottom:8px">📦</div>
        <h2>Drop your Discord data package here</h2>
        <p>or click to select <strong>package.zip</strong></p>

        <button class="btn" on:click|stopPropagation={() => document.getElementById('file-input').click()}>
          Choose package.zip
        </button>

        <input id="file-input" type="file" accept=".zip" style="display:none" on:change={onFileInput} />

        <div style="margin-top: 28px; font-size:13px; color:#72767d; max-width:460px; margin-left:auto; margin-right:auto;">
          Request your data from Discord → User Settings → Privacy &amp; Safety → Request Data.<br>
          This tool only needs the <strong>Messages</strong> + <strong>Account info</strong> parts.
        </div>

        <div style="margin-top:20px;">
          <button on:click|stopPropagation={loadDemo} style="background:#4f545c;color:#dcddde;border:none;padding:10px 18px;border-radius:6px;">
            Load Demo Data
          </button>
        </div>
      </div>

      {#if loading}
        <div class="card" style="margin-top:16px">
          <div class="progress">⏳ {progress || 'Working...'}</div>
        </div>
      {/if}

      {#if error}
        <div class="error">{error}</div>
      {/if}

      <div class="card" style="margin-top:24px; font-size:13.5px; line-height:1.6">
        <strong>Why this exists</strong><br>
        Discord has no built-in cross-server search for your own messages. This pure-static app lets you search and list <em>all</em> your messages across every server and DM from the official data package, with nothing sent anywhere.
      </div>
    {:else}
      <!-- Loaded state -->
      <div style="margin-bottom:8px; color:#72767d; font-size:13px;">
        Loaded: <strong>{fileName}</strong> {isDemo ? '(demo)' : ''}
        — {data.totalMessages.toLocaleString()} messages across {data.channels.length} channels
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class:active={currentTab==='overview'} on:click={() => currentTab='overview'}>Overview</button>
        <button class:active={currentTab==='search'} on:click={() => currentTab='search'}>Search Messages</button>
        <button class:active={currentTab==='activity'} on:click={() => currentTab='activity'}>Activity</button>
      </div>

      {#if currentTab === 'overview'}
        <div class="stats-grid">
          <div class="stat">
            <div class="num">{data.totalMessages.toLocaleString()}</div>
            <div class="label">Total Messages</div>
          </div>
          <div class="stat">
            <div class="num">{data.dmCount}</div>
            <div class="label">DMs / Group DMs</div>
          </div>
          <div class="stat">
            <div class="num">{data.guildCount}</div>
            <div class="label">Servers</div>
          </div>
          <div class="stat">
            <div class="num">{data.totalCharacters.toLocaleString()}</div>
            <div class="label">Characters Sent</div>
          </div>
        </div>

        <div class="card">
          <h3>Profile</h3>
          <p><strong>{data.user.username}#{data.user.discriminator}</strong> (ID: {data.user.id})</p>
          <p style="color:#72767d;font-size:13px">All data shown below is computed 100% in your browser.</p>
        </div>

        {#if data.topGuilds.length}
          <div class="card">
            <h3>Most Active Servers</h3>
            {#each data.topGuilds as g}
              <div style="display:flex;justify-content:space-between;margin:6px 0;font-size:14px">
                <span>{g.name}</span>
                <span style="color:#72767d">{g.count.toLocaleString()} msgs</span>
              </div>
            {/each}
          </div>
        {/if}

        <div class="card">
          <h3>Top Words (5+ chars)</h3>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            {#each data.favoriteWords as w}
              <span style="background:#36393f;padding:4px 10px;border-radius:999px;font-size:13px;">{w.word} <span style="opacity:0.6">×{w.count}</span></span>
            {/each}
          </div>
        </div>
      {/if}

      {#if currentTab === 'search'}
        <div class="card">
          <div style="margin-bottom:12px; font-size:13px; color:#b9bbbe">
            Full-text search across <strong>all</strong> your messages (servers + DMs). Results are local only.
          </div>

          <div class="filters">
            <input
              id="search-input"
              type="text"
              placeholder="Search messages... (e.g. meeting, bug, thanks)"
              bind:value={searchQuery}
              on:input={updateSearchResults}
            />

            <select bind:value={filterType} on:change={updateSearchResults}>
              <option value="all">All channels</option>
              <option value="guild">Servers only</option>
              <option value="dm">DMs only</option>
            </select>

            <input
              type="text"
              placeholder="Filter by channel name"
              bind:value={filterChannel}
              on:input={updateSearchResults}
            />

            <select bind:value={sortMode} on:change={updateSearchResults}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>

            <button on:click={exportResults} style="background:#3ba55c;color:white;border:none;padding:8px 16px;border-radius:6px;font-size:13px">
              Export CSV
            </button>
          </div>

          <div style="margin-bottom:6px; font-size:12px; color:#72767d">
            Showing {searchResults.length} of results (capped at {searchLimit}). Use filters + query to narrow.
          </div>

          <div class="message-list">
            {#if searchResults.length === 0}
              <div style="padding:24px; text-align:center; color:#72767d">No matching messages.</div>
            {:else}
              {#each searchResults as msg}
                <div class="message-item">
                  <div class="meta">
                    <span class="channel">{msg.channelName}</span>
                    {#if msg.guildName && msg.guildName !== 'DM' && msg.guildName !== 'Group DM'}
                      <span style="opacity:0.6"> • {msg.guildName}</span>
                    {/if}
                    <span style="opacity:0.5"> • {formatDate(msg.timestamp)}</span>
                  </div>
                  <div class="content">{msg.content}</div>
                  {#if msg.attachments}
                    <div style="font-size:11px;color:#72767d;margin-top:2px">📎 {msg.attachments}</div>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>

          <div style="font-size:11px;color:#72767d;margin-top:6px">
            Data is processed entirely in-browser. Close the tab to clear everything from memory.
          </div>
        </div>
      {/if}

      {#if currentTab === 'activity'}
        <div class="card">
          <h3>Messages by Hour (your time)</h3>
          <div style="margin:12px 0">
            <!-- Simple bar chart using divs -->
            <div style="display:flex; align-items:flex-end; height:160px; gap:3px; padding:8px 4px; background:#2c2f33; border-radius:6px">
              {#each data.hours as count, h}
                {@const max = Math.max(...data.hours) || 1}
                <div style="flex:1; background:#5865f2; height:{(count / max) * 100}%; min-height:2px; position:relative" title="{h}:00 — {count} messages">
                  {#if count > 0 && (count / max) > 0.3}<span style="position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-size:9px;opacity:.7">{count}</span>{/if}
                </div>
              {/each}
            </div>
            <div style="display:flex; justify-content:space-between; font-size:10px; color:#72767d; margin-top:4px">
              <div>00</div><div>06</div><div>12</div><div>18</div><div>23</div>
            </div>
          </div>
          <p style="font-size:13px;color:#72767d">This is a rough hourly distribution of when you sent messages.</p>
        </div>

        <div class="card">
          <h3>Top words again</h3>
          <div style="font-size:14px; line-height:1.7">
            {#each data.favoriteWords as w}
              {w.word} ({w.count}) 
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <footer>
    Pure static. No tracking. 
    Source: <a href="https://github.com/didvc/discord-data-package-explorer-static" target="_blank">this repo</a> — based on <a href="https://github.com/Androz2091/discord-data-package-explorer" target="_blank">Androz2091's original</a>.<br>
    <a href="https://discord-dpes.pages.dev/" target="_blank">Documentation</a> (multi-language)
  </footer>
</div>
