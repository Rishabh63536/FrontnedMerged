import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductDTO } from '../../models/Product.module';
import { Products } from '../../services/products';
import { Login } from '../../../../core/services/login';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.css'],
})
export class LandingPage implements OnInit {
  userName: string = '';
  loading = true;

  allProducts: ProductDTO[] = [];
  filteredProducts: ProductDTO[] = [];
  searchQuery: string = '';

  // Pagination Configuration
  currentPage: number = 1;
  pageSize: number = 6; // Adjust number of items per page here

  constructor(
    private productService: Products,
    private loginService: Login,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const user = this.loginService.getStoredUser();
    this.userName = user ? user.name : '';

    this.productService.getAllProducts().subscribe({
      next: (result) => {
        this.allProducts = result;
        this.filteredProducts = [...result];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  filterProducts(): void {
    const query = this.searchQuery.toLowerCase().trim();

    if (query === '') {
      this.filteredProducts = this.allProducts;
    } else {
      this.filteredProducts = this.allProducts.filter(
        (product) =>
          product.productName.toLowerCase().includes(query) ||
          product.productDescription.toLowerCase().includes(query),
      );
    }
    
    // Reset back to page 1 whenever filters change
    this.currentPage = 1;
  }

  // Slice item list to show only the items belonging to the active page
  get paginatedProducts(): ProductDTO[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  viewProduct(productId: number): void {
    this.router.navigate(['/customer/products', productId]);
  }
}