import json
import os
import base64
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для загрузки, получения, скачивания, удаления файлов и работы с избранным
    Args: event - dict с httpMethod, body, queryStringParameters, pathParams
          context - object с атрибутами request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Username',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        username = body_data.get('username', 'Anonymous')
        filename = body_data.get('filename')
        file_base64 = body_data.get('fileData')
        description = body_data.get('description', '')
        
        file_data = base64.b64decode(file_base64)
        file_size = len(file_data)
        
        cur = conn.cursor()
        
        cur.execute(
            "INSERT INTO users (username) VALUES (%s) ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username RETURNING id",
            (username,)
        )
        user_id = cur.fetchone()[0]
        
        cur.execute(
            "INSERT INTO files (filename, file_data, file_size, description, user_id) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (filename, file_data, file_size, description, user_id)
        )
        file_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': True, 'fileId': file_id}),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        file_id = params.get('id')
        username = params.get('username')
        action = params.get('action')
        
        cur = conn.cursor()
        
        if action == 'favorites' and username:
            cur.execute(
                "SELECT f.id, f.filename, f.file_size, f.description, f.uploaded_at, u.username FROM files f JOIN users u ON f.user_id = u.id JOIN favorites fav ON fav.file_id = f.id WHERE fav.username = %s ORDER BY fav.created_at DESC",
                (username,)
            )
            rows = cur.fetchall()
            
            files = []
            for row in rows:
                files.append({
                    'id': row[0],
                    'filename': row[1],
                    'fileSize': row[2],
                    'description': row[3],
                    'uploadedAt': row[4].isoformat(),
                    'username': row[5]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'files': files}),
                'isBase64Encoded': False
            }
        
        if file_id:
            cur.execute(
                "SELECT f.id, f.filename, f.file_data, f.file_size, f.description, f.uploaded_at, u.username FROM files f JOIN users u ON f.user_id = u.id WHERE f.id = %s",
                (file_id,)
            )
            row = cur.fetchone()
            
            if not row:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'File not found'}),
                    'isBase64Encoded': False
                }
            
            file_data_base64 = base64.b64encode(row[2]).decode('utf-8')
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'id': row[0],
                    'filename': row[1],
                    'fileData': file_data_base64,
                    'fileSize': row[3],
                    'description': row[4],
                    'uploadedAt': row[5].isoformat(),
                    'username': row[6]
                }),
                'isBase64Encoded': False
            }
        else:
            cur.execute(
                "SELECT f.id, f.filename, f.file_size, f.description, f.uploaded_at, u.username FROM files f JOIN users u ON f.user_id = u.id ORDER BY f.uploaded_at DESC LIMIT 50"
            )
            rows = cur.fetchall()
            
            files = []
            for row in rows:
                files.append({
                    'id': row[0],
                    'filename': row[1],
                    'fileSize': row[2],
                    'description': row[3],
                    'uploadedAt': row[4].isoformat(),
                    'username': row[5]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'files': files}),
                'isBase64Encoded': False
            }
    
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        file_id = body_data.get('fileId')
        username = body_data.get('username')
        
        cur = conn.cursor()
        
        if action == 'favorite':
            cur.execute(
                "SELECT id FROM favorites WHERE file_id = %s AND username = %s",
                (file_id, username)
            )
            exists = cur.fetchone()
            
            if exists:
                cur.execute(
                    "DELETE FROM favorites WHERE file_id = %s AND username = %s",
                    (file_id, username)
                )
                is_favorited = False
            else:
                cur.execute(
                    "INSERT INTO favorites (file_id, username) VALUES (%s, %s)",
                    (file_id, username)
                )
                is_favorited = True
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'isFavorited': is_favorited}),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid action'}),
            'isBase64Encoded': False
        }
    
    if method == 'DELETE':
        params = event.get('queryStringParameters') or {}
        file_id = params.get('id')
        username = params.get('username')
        
        if not file_id or not username:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing parameters'}),
                'isBase64Encoded': False
            }
        
        cur = conn.cursor()
        
        cur.execute(
            "SELECT u.username FROM files f JOIN users u ON f.user_id = u.id WHERE f.id = %s",
            (file_id,)
        )
        row = cur.fetchone()
        
        if not row:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'File not found'}),
                'isBase64Encoded': False
            }
        
        if row[0] != username:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Not authorized'}),
                'isBase64Encoded': False
            }
        
        cur.execute("DELETE FROM favorites WHERE file_id = %s", (file_id,))
        cur.execute("DELETE FROM files WHERE id = %s", (file_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    
    conn.close()
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }