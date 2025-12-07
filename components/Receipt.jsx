'use client';

import { useRef, useEffect } from 'react';

export default function Receipt({ saleData, onClose }) {
  const receiptRef = useRef();

  // Auto-trigger print dialog when receipt opens
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePrint();
    }, 500); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    const printContent = receiptRef.current;
    const windowPrint = window.open('', '', 'width=800,height=600');
    
    windowPrint.document.write(`
      <html>
        <head>
          <title>Receipt - ${saleData.receiptNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              background: white;
            }
            .receipt {
              max-width: 300px;
              margin: 0 auto;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-details {
              font-size: 10px;
              line-height: 1.4;
            }
            .section {
              margin: 10px 0;
              padding: 5px 0;
            }
            .section-title {
              font-weight: bold;
              font-size: 11px;
              margin-bottom: 5px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              margin: 3px 0;
            }
            .items-header {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              font-size: 10px;
              border-bottom: 1px solid #000;
              padding: 5px 0;
              margin-top: 10px;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              padding: 5px 0;
              border-bottom: 1px dashed #ccc;
            }
            .item-details {
              flex: 1;
            }
            .item-name {
              font-weight: bold;
            }
            .item-qty {
              font-size: 9px;
              color: #666;
            }
            .item-price {
              text-align: right;
              min-width: 60px;
            }
            .totals {
              margin-top: 10px;
              border-top: 2px solid #000;
              padding-top: 10px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              margin: 5px 0;
            }
            .grand-total {
              font-size: 14px;
              font-weight: bold;
              border-top: 2px solid #000;
              padding-top: 8px;
              margin-top: 8px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px dashed #000;
              font-size: 10px;
            }
            .thank-you {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 5px;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    windowPrint.document.close();
    windowPrint.focus();
    
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Preview */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <div ref={receiptRef}>
              <div className="receipt" style={{ maxWidth: '300px', margin: '0 auto', fontFamily: '"Courier New", monospace' }}>
                {/* Header */}
                <div className="header" style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
                  <div className="logo" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>🥜</div>
                  <div className="company-name" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>TAJALLI</div>
                  <div className="company-details" style={{ fontSize: '10px', lineHeight: '1.4' }}>
                    <div>GSTIN: 07AAXCS0618K1ZT</div>
                    <div>FASSAI: 13323999001107</div>
                    <div style={{ marginTop: '5px' }}>16-B Jangpura Road</div>
                    <div>Bhogal, Jangpura, New Delhi</div>
                    <div>📞 +91-XXXXXXXXXX</div>
                  </div>
                </div>

                {/* Receipt Info */}
                <div className="section">
                  <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', margin: '3px 0' }}>
                    <span>Receipt:</span>
                    <span style={{ fontWeight: 'bold' }}>{saleData.receiptNumber}</span>
                  </div>
                  <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', margin: '3px 0' }}>
                    <span>Date:</span>
                    <span>{formatDate(saleData.date)}</span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="section" style={{ borderTop: '1px dashed #ccc', paddingTop: '8px', marginTop: '8px' }}>
                  <div className="section-title" style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '5px' }}>Customer Details:</div>
                  <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', margin: '3px 0' }}>
                    <span>Name:</span>
                    <span>{saleData.customerName}</span>
                  </div>
                  <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', margin: '3px 0' }}>
                    <span>Mobile:</span>
                    <span>{saleData.customerMobile}</span>
                  </div>
                  <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', margin: '3px 0' }}>
                    <span>Address:</span>
                    <span style={{ textAlign: 'right', maxWidth: '60%' }}>{saleData.customerAddress}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="section" style={{ marginTop: '10px' }}>
                  <div className="items-header" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px', borderBottom: '1px solid #000', padding: '5px 0' }}>
                    <span>Item</span>
                    <span>Price</span>
                  </div>
                  {saleData.items.map((item, index) => (
                    <div key={index} className="item-row" style={{ padding: '5px 0', borderBottom: '1px dashed #ccc' }}>
                      <div className="item-details" style={{ flex: 1 }}>
                        <div className="item-name" style={{ fontWeight: 'bold', fontSize: '10px' }}>{item.name}</div>
                        <div className="item-qty" style={{ fontSize: '9px', color: '#666' }}>
                          {item.unit === 'kg' ? `${item.quantity / 1000} kg` : `${item.quantity} pcs`} × {formatCurrency(item.price)}
                        </div>
                      </div>
                      <div className="item-price" style={{ textAlign: 'right', minWidth: '60px', fontSize: '10px' }}>
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="totals" style={{ marginTop: '10px', borderTop: '2px solid #000', paddingTop: '10px' }}>
                  <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', margin: '5px 0' }}>
                    <span>Subtotal:</span>
                    <span>{formatCurrency(saleData.subtotal)}</span>
                  </div>
                  <div className="grand-total" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', borderTop: '2px solid #000', paddingTop: '8px', marginTop: '8px' }}>
                    <span>Total:</span>
                    <span>{formatCurrency(saleData.total)}</span>
                  </div>
                  <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', margin: '8px 0 0 0' }}>
                    <span>Payment Mode:</span>
                    <span style={{ fontWeight: 'bold' }}>{saleData.paymentMethod}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="footer" style={{ textAlign: 'center', marginTop: '15px', paddingTop: '10px', borderTop: '2px dashed #000', fontSize: '10px' }}>
                  <div className="thank-you" style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>Thank You!</div>
                  <div>Visit Again 😊</div>
                  <div style={{ marginTop: '8px', fontSize: '9px' }}>www.tajalli.com</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 p-4 bg-gray-50 border-t">
            <button
              onClick={handlePrint}
              className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 font-medium transition flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

