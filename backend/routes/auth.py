from flask import Blueprint, request, jsonify, session
from database import get_db, DATABASE_URL
import hashlib
import re


auth_bp = Blueprint('auth', __name__)

def hash_password(password):
    """用 SHA-256 对密码加密，存入数据库的永远是哈希值而非明文"""
    return hashlib.sha256(password.encode()).hexdigest()

def is_valid_email(email):
    return re.match(r'^[^@]+@[^@]+\.[^@]+$', email)

# ── 注册 ──────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email    = data.get('email', '').strip()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    if not is_valid_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    conn = get_db()
    try:
        if DATABASE_URL:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO users (username, email, password) VALUES (%s, %s, %s)',
                (username, email, hash_password(password))
            )
            cursor.close()
        else:
            conn.execute(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                (username, email, hash_password(password))
            )
        conn.commit()
        return jsonify({'message': 'Registration successful'}), 201
    except Exception as e:
        print(f"Register error: {e}")
        return jsonify({'error': 'Username or email already in use'}), 409
    finally:
        conn.close()

# ── 登录 ──────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email    = data.get('email', '').strip()
    password = data.get('password', '')

    conn = get_db()
    if DATABASE_URL:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT * FROM users WHERE email = %s AND password = %s',
            (email, hash_password(password))
        )
        user = cursor.fetchone()
        cursor.close()
    else:
        user = conn.execute(
            'SELECT * FROM users WHERE email = ? AND password = ?',
            (email, hash_password(password))
        ).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': 'Incorrect email address or password'}), 401

    user = dict(user)
    session['user_id'] = user['id']
    session['username'] = user['username']

    return jsonify({
        'message': 'Login successful',
        'user': {'id': user['id'], 'username': user['username'], 'email': user['email']}
    })

# ── 登出 ──────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logout successful'})

# ── 检查当前登录状态 ───────────────────────────────
@auth_bp.route('/me', methods=['GET'])
def me():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    return jsonify({'user_id': session['user_id'], 'username': session['username']})

# ── 更新个人资料 ───────────────────────────────────
@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
 
    data = request.get_json()
    username = data.get('username', '').strip()
    email    = data.get('email', '').strip()
    password = data.get('password', '')
 
    if not username or not email:
        return jsonify({'error': 'Username and email cannot be empty'}), 400
    if not is_valid_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
 
    conn = get_db()
    try:
        if password:
            # 更新包含密码
            if DATABASE_URL:
                cursor = conn.cursor()
                cursor.execute(
                    'UPDATE users SET username=%s, email=%s, password=%s WHERE id=%s',
                    (username, email, hash_password(password), session['user_id'])
                )
                cursor.close()
            else:
                conn.execute(
                    'UPDATE users SET username=?, email=?, password=? WHERE id=?',
                    (username, email, hash_password(password), session['user_id'])
                )
        else:
            # 不更新密码
            if DATABASE_URL:
                cursor = conn.cursor()
                cursor.execute(
                    'UPDATE users SET username=%s, email=%s WHERE id=%s',
                    (username, email, session['user_id'])
                )
                cursor.close()
            else:
                conn.execute(
                    'UPDATE users SET username=?, email=? WHERE id=?',
                    (username, email, session['user_id'])
                )
        conn.commit()
 
        # 更新 session
        session['username'] = username
 
        return jsonify({
            'message': 'Profile updated',
            'user': {'username': username, 'email': email}
        })
    except Exception as e:
        print(f"Profile update error: {e}")
        return jsonify({'error': 'Username or email already in use'}), 409
    finally:
        conn.close()