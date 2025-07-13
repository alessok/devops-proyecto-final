import { pool } from '../config/database';
import { User, UserCreate, UserUpdate, UserRole } from '../types';
import bcrypt from 'bcryptjs';

export class UserService {
  async findById(id: number): Promise<User | null> {
    const query = `
      SELECT id, email, username, first_name as "firstName", last_name as "lastName", 
             role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM users WHERE id = $1 AND is_active = true
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, username, password, first_name as "firstName", last_name as "lastName", 
             role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM users WHERE email = $1 AND is_active = true
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const query = `
      SELECT id, email, username, first_name as "firstName", last_name as "lastName", 
             role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM users WHERE username = $1 AND is_active = true
    `;
    
    const result = await pool.query(query, [username]);
    return result.rows[0] || null;
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[], total: number }> {
    console.log('UserService.findAll called with page:', page, 'limit:', limit);
    
    const offset = (page - 1) * limit;
    console.log('Calculated offset:', offset);
    
    console.log('Executing count query...');
    const countQuery = 'SELECT COUNT(*) FROM users WHERE is_active = true';
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].count);
    console.log('Count result:', total);

    console.log('Executing main query...');
    const query = `
      SELECT id, email, username, first_name as "firstName", last_name as "lastName", 
             role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM users WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [limit, offset]);
    console.log('Main query result rows count:', result.rows.length);
    console.log('Returning from findAll');
    
    return { users: result.rows, total };
  }

  async create(userData: UserCreate): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const query = `
      INSERT INTO users (email, username, password, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, username, first_name as "firstName", last_name as "lastName", 
                role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const values = [
      userData.email,
      userData.username,
      hashedPassword,
      userData.firstName,
      userData.lastName,
      userData.role || UserRole.EMPLOYEE
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id: number, userData: UserUpdate): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (userData.email) {
      fields.push(`email = $${paramCount}`);
      values.push(userData.email);
      paramCount++;
    }
    
    if (userData.username) {
      fields.push(`username = $${paramCount}`);
      values.push(userData.username);
      paramCount++;
    }
    
    if (userData.firstName) {
      fields.push(`first_name = $${paramCount}`);
      values.push(userData.firstName);
      paramCount++;
    }
    
    if (userData.lastName) {
      fields.push(`last_name = $${paramCount}`);
      values.push(userData.lastName);
      paramCount++;
    }
    
    if (userData.role) {
      fields.push(`role = $${paramCount}`);
      values.push(userData.role);
      paramCount++;
    }
    
    if (userData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      values.push(userData.isActive);
      paramCount++;
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, username, first_name as "firstName", last_name as "lastName", 
                role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const query = 'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
