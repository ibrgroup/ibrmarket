'use client';

import type { FC } from 'react';
import { ProductSectionLarge } from './ProductSectionLarge';
import type { ProductSectionProps } from '../model/types';

const ProductSection: FC<ProductSectionProps> = ({ products, title, showViewAll, onViewAll }) => {
 return (
    <section className="product-section">
      <div className="max-container m-auto">
        <ProductSectionLarge
          products={products}
          title={title}
          showViewAll={showViewAll}
          onViewAll={onViewAll}
        />
      </div>
    </section>
  );
};

export default ProductSection;
