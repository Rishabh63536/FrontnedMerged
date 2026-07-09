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

  // Bound to the search input using ngModel for two-way data binding
  searchQuery: string = '';

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
        console.log(err);
        this.loading = false;
      },
    });
  }

  // whenever user types or clicks search this will be called for filter
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
  }

  viewProduct(productId: number): void {
    this.router.navigate(['/customer/products', productId]);
  }
}
