import pool from '../config/database';
import { Product, ProductCreate, ProductUpdate } from '../types';

export class ProductService {
  async findById(id: number): Promise<Product | null> {
    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1 AND p.is_active = true
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const query = `
      SELECT * FROM products WHERE sku = $1 AND is_active = true
    `;
    
    const result = await pool.query(query, [sku]);
    return result.rows[0] || null;
  }

  async findAll(
    page: number = 1, 
    limit: number = 10, 
    search?: string,
    categoryId?: number
  ): Promise<{ products: Product[], total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE p.is_active = true';
    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      whereClause += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount} OR p.sku ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (categoryId) {
      whereClause += ` AND p.category_id = $${paramCount}`;
      params.push(categoryId);
      paramCount++;
    }
    
    const countQuery = `SELECT COUNT(*) FROM products p ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    params.push(limit, offset);
    const result = await pool.query(query, params);
    return { products: result.rows, total };
  }

  async findLowStock(): Promise<Product[]> {
    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock_quantity <= p.min_stock_level AND p.is_active = true
      ORDER BY (p.stock_quantity - p.min_stock_level) ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  async create(productData: ProductCreate): Promise<Product> {
    const query = `
      INSERT INTO products (name, description, sku, category_id, price, stock_quantity, min_stock_level)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      productData.name,
      productData.description,
      productData.sku,
      productData.categoryId,
      productData.price,
      productData.stockQuantity,
      productData.minStockLevel
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id: number, productData: ProductUpdate): Promise<Product | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (productData.name) {
      fields.push(`name = $${paramCount}`);
      values.push(productData.name);
      paramCount++;
    }
    
    if (productData.description) {
      fields.push(`description = $${paramCount}`);
      values.push(productData.description);
      paramCount++;
    }
    
    if (productData.sku) {
      fields.push(`sku = $${paramCount}`);
      values.push(productData.sku);
      paramCount++;
    }
    
    if (productData.categoryId) {
      fields.push(`category_id = $${paramCount}`);
      values.push(productData.categoryId);
      paramCount++;
    }
    
    if (productData.price !== undefined) {
      fields.push(`price = $${paramCount}`);
      values.push(productData.price);
      paramCount++;
    }
    
    if (productData.stockQuantity !== undefined) {
      fields.push(`stock_quantity = $${paramCount}`);
      values.push(productData.stockQuantity);
      paramCount++;
    }
    
    if (productData.minStockLevel !== undefined) {
      fields.push(`min_stock_level = $${paramCount}`);
      values.push(productData.minStockLevel);
      paramCount++;
    }
    
    if (productData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      values.push(productData.isActive);
      paramCount++;
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE products SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async updateStock(id: number, quantity: number): Promise<Product | null> {
    const query = `
      UPDATE products 
      SET stock_quantity = stock_quantity + $1, updated_at = NOW()
      WHERE id = $2 AND is_active = true
      RETURNING *
    `;
    
    const result = await pool.query(query, [quantity, id]);
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const query = 'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async getInventoryStats(): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_products,
        SUM(stock_quantity) as total_stock,
        COUNT(CASE WHEN stock_quantity <= min_stock_level THEN 1 END) as low_stock_count,
        AVG(price) as average_price
      FROM products 
      WHERE is_active = true
    `;
    
    const result = await pool.query(query);
    return result.rows[0];
  }
}
