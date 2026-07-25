# Harei API 清单

> 说明：除特别标注外，所有需要鉴权的接口使用 `Authorization: Bearer <token>` 请求头。

> host：`https://api.harei.cn`

## 认证
### POST `/login`（无需 Token）
**请求体**
```json
{
  "username": "string",
  "password": "string"
}
```
**响应**
```json
{
  "code": 0,
  "token": "string",
  "user": { "username": "string" }
}
```

### POST `/logout`（需要 Token）
**响应**
```json
{ "code": 0, "success": true }
```

### GET `/auth`（需要 Token）
**响应**
```json
{
  "code": 0,
  "authenticated": true,
  "user": { "username": "string" }
}
```

## 留言箱 /box
### POST `/box/uploads`（无需 Token）
**表单字段**
- `message`：string，必填
- `tag`：string，必填
- `files`：file[]，可选（支持多图）

**限速**
- 同一 IP 限速：30 秒内最多 1 次、1 小时内最多 3 次、每天最多 5 次
- 无法获取真实客户端 IP 时（`0.0.0.0`）不限速
- 缺少字段的请求同样计入限速

**响应**
```json
{
  "code": 0,
  "message_id": 1,
  "image_ids": [1, 2]
}
```

**超速响应**
```json
{
  "detail": {
    "retry_at": 1719999999
  }
}
```

**缺少字段响应**
```json
{
  "detail": {
    "missing_fields": ["message", "tag"]
  }
}
```

### GET `/box/image/original?path=...`（需要 Token）
**响应**：图片文件

### GET `/box/image/thumb?path=...`（需要 Token）
**响应**：图片文件

### GET `/box/image/jpg?path=...`（需要 Token）
**响应**：图片文件

### GET `/box/pending`（需要 Token）
**响应**
```json
{
  "code": 0,
  "items": [
    {
      "id": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "msg": "string",
      "tag": "string",
      "images": ["uploads/original/xxx.png"],
      "images_thumb": ["uploads/thumbs/xxx.jpg"],
      "images_jpg": ["uploads/jpg/xxx.jpg"]
    }
  ]
}
```

### GET `/box/approved`（需要 Token）
响应结构同 `/box/pending`。

### POST `/box/approve`（需要 Token）
**请求体（可选）**
```json
{ "tag": "string" }
```
> 说明：不传请求体（或不传 `tag`）时，保持原行为（全量过审 `pending`）；传 `tag` 时仅过审该标签下 `pending` 消息。

**响应**
```json
{ "code": 0, "message": "X条消息已过审" }
```

### POST `/box/delete`（需要 Token）
**请求体**
```json
{ "id": 1 }
```
**响应**
```json
{ "code": 0, "message": "id1已删除" }
```

### POST `/box/archived`（需要 Token）
**请求体（可选）**
```json
{ "tag": "string" }
```
> 说明：不传请求体（或不传 `tag`）时，保持原行为（全量归档 `approved`）；传 `tag` 时仅归档该标签下 `approved` 消息。

**响应**
```json
{ "code": 0, "message": "X条消息已归档" }
```

## 下载 /download
### GET `/download/active`（无需 Token）
**响应**
```json
{
  "code": 0,
  "items": [
    {
      "download_id": 1,
      "description": "string",
      "path": "https://example.com/file.zip"
    }
  ]
}
```
> 说明：`path` 仅返回外部可访问链接，内部文件会返回 `/download/file?download_id=...` 形式的链接。

### GET `/download/file?download_id=...`（无需 Token）
**响应**：文件内容（仅支持内部路径）

### POST `/download/add`（需要 Token）
**请求体（JSON）**
```json
{ "description": "string", "path": "https://example.com/file.zip" }
```

**请求体（表单，上传文件）**
- `description`：string，必填
- `file`：file，必填

**响应**
```json
{ "code": 0, "download_id": 1, "path": "download_files/xxx.zip" }
```

## 音乐
### GET `/music`（无需 Token）
支持 `q`、`search_mode=title|artist`、`genre`、`language`、`work_type`、`sort=title|recent|count`、`order=asc|desc`、`page`、`page_size`（最大 1000）。响应包含 `ETag`，匹配的 `If-None-Match` 返回 `304`。

### 音乐管理
`POST /music-manage/login` 签发仅含 `music:manage` 的 Token。其余 `/music-manage` 路由均需该 scope，包括统计、歌曲管理、归档/恢复、演唱记录管理、XLSX 模板与批量导入、审计。歌曲与演唱记录的 `source_key` 均由服务端生成；BV 号或直播间 ID 从歌切/直播链接自动解析。所有歌曲或演唱记录变更均需提交当前歌曲 `version`；过期写入返回 `409`。公开详情为 `GET /music/{source_key}`，完整快照为 `GET /music/export`。

- `GET /music-manage/performances/template`：下载包含 `导入数据`、`歌曲列表` 的 XLSX 模板。
- `POST /music-manage/performances/import`：上传最大 5 MiB 的 XLSX；按歌名完全匹配，逐行返回校验错误，并保证整批原子写入。

**响应**
```json
{
  "code": 0,
  "items": [
    {
      "song_id": 1,
      "id": "song_123",
      "source_key": "song_123",
      "title": "string",
      "artist": "string",
      "artists": ["string"],
      "genre": "华语流行",
      "language": "string",
      "workType": "翻唱",
      "notes": "",
      "metadataStatus": "complete",
      "latestPerformanceAt": "2026-07-25",
      "latestLink": "https://www.bilibili.com/video/BV1...",
      "performanceCount": 1
    }
  ],
  "total": 478,
  "page": 1,
  "page_size": 30,
  "facets": { "genres": [], "languages": [], "workTypes": [] },
  "stats": { "song_count": 478, "performance_count": 2685 },
  "revision": 0
}
```

## 黄豆排行 /huangdou
### GET `/huangdou/rank`（无需 Token）
**响应**
```json
{
  "code": 0,
  "items": [
    { "uid": "string", "name": "string", "count": 100 }
  ]
}
```

### GET `/huangdou/uid?uid=...`（无需 Token）
**响应**
```json
{ "code": 0, "uid": "string", "name": "string", "count": 100 }
```

## 标签 /tag
### GET `/tag/active`（无需 Token）
**响应**
```json
{ "code": 0, "items": ["tag1", "tag2"] }
```

### POST `/tag/add`（需要 Token）
**请求体**
```json
{ "tag_name": "string" }
```
**响应**
```json
{ "code": 0, "message": "ok" }
```

### GET `/tag/all`（需要 Token）
**响应**
```json
{
  "code": 0,
  "items": [
    {
      "tag_id": 1,
      "tag_name": "string",
      "status": "approved",
      "expires_at": null,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/tag/archived`（需要 Token）
**请求体**
```json
{ "tag_name": "string" }
```
**响应**
```json
{ "code": 0, "message": "ok" }
```

## 舰长 /captains
### GET `/captains`（需要 Token）
**查询参数**
- `month`：YYYYMM，可选
- `uid`：string，可选（优先级高于 month）

**响应**
```json
{
  "code": 0,
  "items": [
    {
      "uid": "string",
      "name": "string",
      "level": "舰长",
      "count": 1,
      "red_packet": false,
      "joined_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/captains/xlsx?month=YYYYMM`（需要 Token）
**说明**：按月份下载整理好的舰长 XLSX 文件。

**响应**：XLSX 文件

**失败响应**
```json
{ "detail": "未找到YYYYMM上舰记录" }
```

## 舰礼 /captaingift
### GET `/captaingift`（无需 Token）
**响应**
```json
{
  "code": 0,
  "items": [
    { "month": "202512", "path": "uploads/captaingift/202512.jpg" }
  ]
}
```

### GET `/captaingift/image?month=YYYYMM`（无需 Token）
**响应**：图片文件

### POST `/captaingift/add`（需要 Token）
**表单字段**
- `month`：YYYYMM
- `file`：图片文件（单张）

**响应**
```json
{ "code": 0, "message": "202512已上传" }
```

## 直播监控 /live
### GET `/live/status`（无需 Token）
**响应**
```json
{
  "status": 1,
  "live_time": "2024-01-01 12:00:00",
  "title": "string"
}
```
