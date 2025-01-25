import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule,HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    FormsModule,
    CommonModule,
    RouterModule,
    HttpClientModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  enteredMobile: string = ''; // Initialize as an empty string to satisfy strict mode
  email: string = ''; // Initialize with an empty string
  isOtpSent: boolean = false; 
  isLoginMode: boolean = true;
  loading = false;
  errorMessage: string = '';
  showOtpCard = false; // State to show OTP card
  otp = ''; // Variable to store entered OTP
  userData: any = null;
  showOtpForm= false;
  password: string = ''; 

  constructor(private http: HttpClient, private router: Router, private snackBar: MatSnackBar) {}
  showLoginPassword = false;
  showSignupPassword = false;
  showSignupConfirmPassword = false;
  
  toggleLoginPasswordVisibility(): void {
    this.showLoginPassword = !this.showLoginPassword;
  }
  
  toggleSignupPasswordVisibility(): void {
    this.showSignupPassword = !this.showSignupPassword;
  }
  
  toggleSignupConfirmPasswordVisibility(): void {
    this.showSignupConfirmPassword = !this.showSignupConfirmPassword;
  }
  
  toggleMode() {
    this.showSuccessModal = false;
    this.isLoginMode = !this.isLoginMode;
    this.showOtpForm = false; // Reset OTP form visibility when toggling

  }
  onLogin(form: any) {
    if (form.valid) {
      const email = form.value.email;
      const password = form.value.password;
  
      this.loading = true; // Show loading spinner
      this.http.post('http://localhost:5000/login', { email, password }).subscribe(
        (response: any) => {
          this.loading = false; // Hide loading spinner
  
          const { token, username, requireOTP, mobile, message } = response;
  
          if (token) {
            // Decode token to extract user info
            const decodedToken = this.decodeToken(token);
  
            if (decodedToken) {
              const { id: userId, role } = decodedToken;
  
              // Save user data in localStorage
              localStorage.setItem('token', token);
              localStorage.setItem('userId', userId);
              localStorage.setItem('role', role);
              localStorage.setItem('username', username);
  
              if (requireOTP) {
                // If OTP verification is required
               
                  this.enteredMobile = mobile || ''; 
                  this.email = email;
                  this.password=password; // Prefill mobile if provided
                  console.log("Got the error")
                  this.showOtpForm = true; // Show OTP form
                  console.log("Opened the form")

            
                }
               else {
                // If OTP is not required, navigate based on role
                this.redirectUserByRole(role);
              }
            } else {
              this.errorMessage = "Invalid token. Unable to process login.";
            }
          } else if (message) {
            // Handle specific messages in the response if token is not provided
            this.errorMessage = message;
          } else {
            this.errorMessage = "An unexpected error occurred. Please try again.";
          }
        },
        (error) => {
          this.loading = false;
  
          if (error.status === 401) {
            // Handle unauthorized errors
            if (error.error.message === "Password is Incorrect") {
              this.errorMessage = "Password is Incorrect.";
            } else if (error.error.message === "User not found. Please check your email.") {
              this.errorMessage = "User not found. Please check your email.";
            } else {
              this.errorMessage = "An error occurred during login. Please try again.";
            }
          } else {
            this.errorMessage = "An error occurred during login. Please try again.";
          }
        }
      );
    }
  }
  
  
  sendOtpForLogin() {
    if (!this.enteredMobile  ||  !this.enteredMobile.match(/^[0-9]{10}$/)) {
      alert('Please provide a valid 10-digit mobile number.');
      return;
    }
    this.isLoginFlow = true; // Set flag for login flow
    
    this.http
      .get<{ authToken: string }>(
        `http://localhost:5000/sendotp?mobile=${this.enteredMobile}&email=${this.email}`
      )
      .subscribe(
        (response) => {
          console.log(response);
          this.showOtpCard = true;
          this.authToken = response.authToken;
          this.isOtpSent = true; 
          this.userData = { email: this.email, mobile: this.enteredMobile ,password:this.password};
        },
        (error) => {
          this.isOtpSent = false 
          console.error('Error sending OTP during login:', error);
          alert('Failed to send OTP. Please try again.');
        }
      );
  }
   

  private decodeToken(token: string): any {
    try {
      const base64Payload = token.split('.')[1]; // Get the payload part of the token
      const payload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/')); // Decode Base64 URL-safe
      return JSON.parse(payload); // Parse the payload as JSON
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
  showSuccessModal = false;
  authToken: string | null = null; // Declare the authToken property

  onSignup(form: any) {
    if (form.valid) {
      const { name, email, mobile, gender, pincode, city, password, confirmPassword } = form.value;

      if (password === confirmPassword) {
        this.loading = true; // Show loading spinner

        // Simulate sending OTP
        this.http.get<{ authToken: string }>(`http://localhost:5000/sendotp?mobile=${mobile}&email=${email}&isSignup=true`).subscribe(
          (response) => {
            console.log(response)
            this.loading = false; // Hide spinner
            this.showOtpCard = true; // Show OTP card
            this.authToken = response.authToken; // Save authToken from backend

            this.userData = { name, email, mobile, gender, pincode, city, password }; // Save user data temporarily
          },
          (error) => {
            this.loading = false; // Hide spinner
            console.error('Error sending OTP:', error);
  
            // Display appropriate error messages
            if (error.error?.error === 'Email already exists.') {
              alert('The email you entered is already registered. Please use another email.');
            } else if (error.error?.error === 'Mobile number already exists.') {
              alert('The mobile number you entered is already registered. Please use another number.');
            } else {
              alert('Failed to send OTP. Please try again.');
            }
          }
        );
      } else {
        alert('Passwords do not match.');
      }
    }
  }

 
verifyOtp() {
  if (this.otp) {
    this.loading = true; // Show loading spinner

    // Verify OTP API call
    this.http.post('http://localhost:5000/verify', { otp: this.otp, mobile: this.userData.mobile, authToken: this.authToken }).subscribe(
      (response: any) => {
        if (response.resultStatus === 'SUCCESS') {
          if (this.isLoginFlow) {
            // If it's login, complete the login process
            this.loading = false;
            this.showOtpCard = false;

            // Now fetch the user data and store it
            this.http.post('http://localhost:5000/login', { email: this.userData.email,password:this.userData.password}).subscribe(
              (loginResponse: any) => {
                const { token, id: userId, role, username } = loginResponse;

                if (token) {
                  localStorage.setItem('token', token);
                  localStorage.setItem('userId', userId);
                  localStorage.setItem('role', role);
                  localStorage.setItem('username', username);

                  this.redirectUserByRole(role);
                } else {
                  console.error('Token not received in the response');
                }
              },
              (error) => {
                console.error('Login error after OTP verification:', error);
                alert('Login failed. Please try again.');
              }
            );
          } else {
            // If it's signup, proceed with registration
            this.http.post('http://localhost:5000/register', this.userData).subscribe(
              () => {
                this.loading = false;
                this.showOtpCard = false;
                this.showSuccessModal = true;
              },
              (error) => {
                this.loading = false;
                console.error('Signup error:', error);
                alert('Signup failed. Please try again.');
              }
            );
          }
        } else {
          this.loading = false;
          alert('Invalid OTP. Please try again.');
        }
      },
      (error) => {
        this.loading = false;
        console.error('OTP verification error:', error);
        alert('Failed to verify OTP. Please try again.');
      }
    );
  } else {
    alert('Please enter the OTP.');
  }
}
isLoginFlow: boolean = false;  // Define the isLoginFlow property

  
  redirectToLogin() {
    this.showSuccessModal = false; // Hide the modal
    this.router.navigate(['/login']); // Redirect to login
  }
  private redirectUserByRole(role: string) {
    switch (role) {
      case 'Admin':
        this.router.navigate(['/layout']); // Admin layout
        break;
      case 'TeamLeader':
        this.router.navigate(['/TeamsManager']); // Team manager page
        break;
      default:
        this.router.navigate(['/users']); // Default for team members
        break;
    }
  }
}
