import { pool } from '../config/database';
import { Category, CategoryCreate, CategoryUpdate } from '../types';

export class CategoryService {
  async findById(id: number): Promise<Category | null> {
    const query = `
      SELECT * FROM categories WHERE id = $1 AND is_active = true
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByName(name: string): Promise<Category | null> {
    const query = `
      SELECT * FROM categories WHERE name = $1 AND is_active = true
    `;
    
    const result = await pool.query(query, [name]);
    return result.rows[0] || null;
  }

  async findAll(): Promise<Category[]> {
    const query = `
      SELECT * FROM categories WHERE is_active = true ORDER BY name ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  async create(categoryData: CategoryCreate): Promise<Category> {
    const query = `
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const values = [categoryData.name, categoryData.description];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id: number, categoryData: CategoryUpdate): Promise<Category | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (categoryData.name) {
      fields.push(`name = $${paramCount}`);
      values.push(categoryData.name);
      paramCount++;
    }
    
    if (categoryData.description) {
      fields.push(`description = $${paramCount}`);
      values.push(categoryData.description);
      paramCount++;
    }
    
    if (categoryData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      values.push(categoryData.isActive);
      paramCount++;
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE categories SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const query = 'UPDATE categories SET is_active = false, updated_at = NOW() WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async getProductCount(id: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM products 
      WHERE category_id = $1 AND is_active = true
    `;
    
    const result = await pool.query(query, [id]);
    return parseInt(result.rows[0].count);
  }
}
