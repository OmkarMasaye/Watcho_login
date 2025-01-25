import { Component, OnInit ,Output,EventEmitter} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormsModule, ReactiveFormsModule ,FormGroup,Validators,FormBuilder} from '@angular/forms'; // Import FormsModule
import { MatPaginatorModule } from '@angular/material/paginator'; // Import MatPaginatorModule
import { MatTableModule } from '@angular/material/table'; // Import MatTableModule
import { MatSortModule } from '@angular/material/sort'; // Import MatSortModule
import { CommonModule } from '@angular/common';
import { MatNativeDateModule, MatOption } from '@angular/material/core';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table'; // Import MatTableDataSource
import { ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'; // Import BreakpointObserver
import { MatButtonModule } from '@angular/material/button';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';


interface Order {
  orderId: string;
  link: string;
  paymentStatus?: 'Paid' | 'Unpaid'; // Optional, will be used for UI tracking
  status: 'Assign' | 'Completed'; // Use your existing status
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [MatIconModule, MatCardModule,ReactiveFormsModule, FormsModule,MatPaginatorModule,MatTableModule,MatSortModule,CommonModule,MatSelectModule,MatButtonModule,MatTooltipModule,MatCardModule,MatDatepickerModule, MatFormFieldModule,  MatInputModule,MatNativeDateModule], // Include FormsModule here
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  username: string = ''; 
  initials: string = ''; 
  isDarkMode: boolean = false; 
  paginatedData: any[] = []; 
  leadIds: string[] = []; 
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalRecords: number = 0;
  allocatedLeadCounts: number = 0;
  totalLeads: number = 0; // Total leads to calculate remaining leads
  remainingLeads: number = 0; // The remaining leads after allocation
  selectedDate: Date = new Date(); // Default to the current date
  selectedPaidStatus: string | null = null;
  totalAllocatedLeads: number = 0; // New variable to store the total number of allocated leads
  // leadIds: any[] = [];
  completedCount: number = 0;

  paidCount: number = 0; // Initially set to 0
  unpaidCount: number = 0; // Initially set to 0
  dataSource = new MatTableDataSource<Order>([]); // Use the Order interface
  orders: Order[] = []; // To store fetched orders
    apiUrl = 'http://localhost:5000/api/allocated-leads';

    @Output() closeModal = new EventEmitter<void>();
    changePasswordForm: FormGroup;
    isResponseCardVisible = false;
    responseMessage = '';
    isChangePasswordModalOpen = false;
    oldPasswordVisible = false;
    newPasswordVisible = false;

  constructor(private fb: FormBuilder,private http: HttpClient, private breakpointObserver: BreakpointObserver) {
    this.changePasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6),Validators.maxLength(12),Validators.pattern('^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,12}$') ]],
    });
  }  



  openChangePasswordModal() {
    this.isChangePasswordModalOpen = true;
  }

  closeChangePasswordModal() {
    this.isChangePasswordModalOpen = false;
  }

  onSubmit() {
    if (this.changePasswordForm.valid) {
      const {newPassword } = this.changePasswordForm.value;
      const headers = new HttpHeaders({
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            });
      this.http.put('http://localhost:5000/change-password', {newPassword}, {headers }).subscribe({
        next: (res: any) => {
          this.responseMessage = res.message || 'Password changed successfully.';
          this.isResponseCardVisible = true;
          this.isChangePasswordModalOpen = false;
        },
        error: (err) => {
          this.responseMessage = err.error?.message || 'An error occurred.';
          this.isResponseCardVisible = true;
        },
      });
    }
  }

  togglePasswordVisibility(field: string) {
    if (field === 'newPassword') {
      this.newPasswordVisible = !this.newPasswordVisible;
    }
  }

  closeResponseCard() {
    this.isResponseCardVisible = false;
    this.closeModal.emit();
  }



  ngOnInit(): void {
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    this.username = localStorage.getItem('username') || '';
    this.initials = this.getInitials(this.username); // Generate initials from username
    this.fetchAllocatedLeads(); // Fetch allocated leads count
  
    // Initialize displayedColumns
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe((result) => {
      if (result.matches) {
        // On mobile, show 'serialNumber', 'orderId', and 'undo' columns
        this.displayedColumns = ['serialNumber', 'orderId', 'undo'];
      } else {
        // On larger screens, show all columns
        this.displayedColumns = ['serialNumber', 'orderId', 'paymentStatus', 'undo'];
      }
    });
  }
  
  

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase(); // Ensure initials are uppercase
  }
   taskCompleted = false;

  downloadLeads() {
    // Implement logic for downloading leads (e.g., triggering a download of a file)
  }
  onFilterChange(): void {
  }

 
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const file = input.files[0];
      console.log('File selected:', file);
    } else {
      console.error('No file selected or input invalid.');
    }
  }
  

  // Pagination related variables

  displayedColumns: string[] = ['orderId', 'undo', 'paymentStatus'];


  paymentModes: string[] = ['PhonepeW', 'Upi'];

  // Event triggered when payment mode is changed
  onPaymentModeChange(element: any): void {
    console.log(`Payment mode updated for Order ID ${element.orderId}:`, element.paymentMode);
    // Additional logic like saving the updated value to the backend can go here
  }
  
  fetchAllocatedLeads(): void {
    const token = localStorage.getItem('token');
    const loggedInUserId = localStorage.getItem('userId');
  
    if (!token || !loggedInUserId) {
      console.error('Token or User ID not found in localStorage.');
      return;
    }
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  
    const params: any = {};
    if (this.selectedDate) {
      const localDate = new Date(this.selectedDate.getTime() - this.selectedDate.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0];
      params.date = localDate;
    }
  
    this.http
      .get<{ allocatedLeadCounts: number; completedCount: number; orders: Order[] }>(
        this.apiUrl,
        { headers, params }
      )
      .subscribe({
        next: (response) => {
          this.allocatedLeadCounts = response.allocatedLeadCounts;
          this.completedCount = response.completedCount; // Store the completed count
          this.orders = response.orders.map(order => {
            // Map orders to set paymentStatus based on the status
            order.paymentStatus = order.status === 'Completed' ? 'Paid' : 'Unpaid';
            return order;
          });
  
          // Update the dataSource for the table
          this.dataSource.data = this.orders;
          console.log('Allocated Leads:', response);
        },
        error: (error) => console.error('Error fetching allocated leads:', error),
      });
  }
  
  
  currentTask = {
    paymentStatus: 'Paid', // Default status or update dynamically
    leadId: '',           // Populate this based on the specific lead/task
  };
  
  updatePaymentStatus(order: Order): void {
    if (order.paymentStatus === 'Paid') return;
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    });
  
    const payload = { orderId: order.orderId };
  
    this.http
      .patch('http://localhost:5000/api/update-order-status', payload, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Payment status updated:', response);
          
          // Update local UI state
          order.paymentStatus = 'Paid'; // Mark as Paid
          order.status = 'Completed'; // Update status to 'Completed'
  
          // Update the counts if needed
          this.completedCount = response.completedCount;
        },
        error: (error) => {
          console.error('Error updating payment status:', error);
        },
      });
  }
  
  undoPaymentStatus(order: Order): void {
    if (order.paymentStatus !== 'Paid') {
      return; // Only allow undo if the payment status is "Paid"
    }
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    });
  
    const payload = { orderId: order.orderId };
  
    this.http
      .patch('http://localhost:5000/api/revert-order-status', payload, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Payment status reverted:', response);
  
          // Update local UI state
          order.paymentStatus = 'Unpaid'; // Mark as Unpaid
          order.status = 'Assign'; // Revert status to 'Assign'
  
          // Update the counts if needed
          this.completedCount = response.completedCount;
        },
        error: (error) => {
          console.error('Error reverting payment status:', error);
        },
      });
  }
  

  onPageChange(event: any) {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
  }
}

