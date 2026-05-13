const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'app.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function initDb() {
  const database = getDb();
  
  // Topics table
  database.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      embedding TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages table
  database.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      model TEXT,
      template_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    )
  `);

  // Templates table
  database.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      system_prompt TEXT NOT NULL,
      variables TEXT,
      example TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default templates if not exists
  const defaultTemplates = [
    {
      id: 'vibe-coding',
      name: 'Vibe Coding',
      description: '用自然语言描述需求，AI生成代码',
      system_prompt: `你是一位全栈开发专家。用户会用自然语言描述编程需求，你需要：
1. 理解需求并澄清歧义
2. 生成可直接运行的代码
3. 解释关键设计决策
请用中文回复，代码注释用英文。`,
      variables: JSON.stringify(['language', 'framework']),
      example: '帮我做一个React登录表单，带邮箱验证和密码强度提示'
    },
    {
      id: 'aigc-storyboard',
      name: 'AIGC分镜提示词',
      description: '将剧本转化为AI视频生成提示词',
      system_prompt: `你是AIGC视频导演。将用户的剧本/创意分解为分镜头脚本，每个镜头包含：
- 画面描述（英文，用于Runway/可灵/Midjourney）
- 运镜方式（推/拉/摇/移/跟等）
- 时长建议（秒）
- 情绪/氛围标签
- 参考风格（电影/艺术家）
请用表格形式输出，方便用户复制到视频生成工具。`,
      variables: JSON.stringify(['platform', 'duration']),
      example: '一个科幻短片开场：未来城市夜景，主角在雨中发现神秘装置'
    },
    {
      id: 'data-analysis',
      name: '数据分析助手',
      description: '分析数据并生成可视化建议',
      system_prompt: `你是数据分析专家。用户会提供数据集或描述分析需求，你需要：
1. 理解业务问题和数据背景
2. 建议合适的分析方法
3. 提供Python/R/SQL代码片段
4. 解释结果的业务含义
请用中文回复，代码用markdown格式。`,
      variables: JSON.stringify(['tool', 'industry']),
      example: '分析某App过去30天的DAU和留存率变化，找出下降原因'
    }
  ];

  const insertTemplate = database.prepare(`
    INSERT OR IGNORE INTO templates (id, name, description, system_prompt, variables, example)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const t of defaultTemplates) {
    insertTemplate.run(t.id, t.name, t.description, t.system_prompt, t.variables, t.example);
  }

  console.log('✅ Database initialized');
}

module.exports = { getDb, initDb };
