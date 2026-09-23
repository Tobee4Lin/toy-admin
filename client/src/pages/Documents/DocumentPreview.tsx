import { DOCUMENT_TYPE_TITLES, type DocumentData } from '@/api/documents';

interface DocumentPreviewProps {
  data: DocumentData;
}

// Convert number to English words for amount
function numberToWords(num: number): string {
  if (num === 0) return 'ZERO';
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const scales = ['', 'THOUSAND', 'MILLION', 'BILLION'];

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  const convertChunk = (n: number): string => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' HUNDRED';
      n %= 100;
      if (n > 0) result += ' AND ';
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)];
      if (n % 10 > 0) result += '-' + ones[n % 10];
    } else if (n > 0) {
      result += ones[n];
    }
    return result;
  };

  let words = '';
  let n = intPart;
  let scaleIdx = 0;
  while (n > 0) {
    const chunk = n % 1000;
    if (chunk > 0) {
      const chunkWords = convertChunk(chunk);
      words = chunkWords + (scales[scaleIdx] ? ' ' + scales[scaleIdx] : '') + (words ? ' ' + words : '');
    }
    n = Math.floor(n / 1000);
    scaleIdx++;
  }

  if (decPart > 0) {
    words += ' AND CENTS ' + (decPart < 10 ? 'ZERO ' : '') + convertChunk(decPart);
  }
  return words;
}

export default function DocumentPreview({ data }: DocumentPreviewProps) {
  const { type, sellerInfo, buyerInfo, items = [], terms, currency = 'USD', shippingMark } = data;
  const title = DOCUMENT_TYPE_TITLES[type] || 'DOCUMENT';

  const calcAmount = (item: typeof items[0]) => {
    const qty = item.quantity || 0;
    const price = item.unitPrice || 0;
    return qty * price;
  };

  const totalAmount = items.reduce((sum, item) => sum + calcAmount(item), 0);
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalCartons = items.reduce((sum, item) => sum + (item.cartons || 0), 0);
  const totalGW = items.reduce((sum, item) => sum + (item.grossWeight || 0), 0);
  const totalNW = items.reduce((sum, item) => sum + (item.netWeight || 0), 0);
  const totalCBM = items.reduce((sum, item) => sum + (item.cbm || 0), 0);
  const totalVolume = items.reduce((sum, item) => sum + (item.totalCbm || item.cbm || 0), 0);
  const deposit = totalAmount * 0.3;
  const balance = totalAmount * 0.7;
  const amountInWords = `SAY US DOLLAR ${numberToWords(totalAmount)} ONLY.`;

  const isPL = type === 'pl';
  const isCI = type === 'ci';
  const showAmount = type === 'pi' || type === 'ci';

  return (
    <div className="document-preview bg-white text-[#1a1a1a]" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-[#1a3a5c]">
        <div className="flex items-start gap-3">
          {sellerInfo?.logo && (
            <img src={sellerInfo.logo} alt="logo" className="w-16 h-16 object-contain" />
          )}
          <div>
            <h1 className="text-xl font-bold text-[#1a3a5c]">{sellerInfo?.companyName || 'Your Company'}</h1>
            {sellerInfo?.email && <p className="text-xs text-gray-600">{sellerInfo.email}</p>}
            {sellerInfo?.tel && <p className="text-xs text-gray-600">Tel: {sellerInfo.tel}</p>}
            {sellerInfo?.address && <p className="text-xs text-gray-600 max-w-xs">{sellerInfo.address}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold tracking-wider text-[#1a3a5c]">{title}</h2>
          <div className="mt-2 text-xs space-y-1">
            <p><span className="font-semibold">No:</span> {data.documentNo}</p>
            <p><span className="font-semibold">Date:</span> {data.date || '-'}</p>
            {!isPL && data.validity && <p><span className="font-semibold">Validity:</span> {data.validity}</p>}
          </div>
        </div>
      </div>

      {/* Buyer Info */}
      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#1a3a5c] mb-2 border-b border-gray-300 pb-1">
          {isPL ? 'Consignee / Notify Party' : type === 'ci' ? 'Sold To / Ship To' : 'Quotation To'}
        </h3>
        <div className="text-xs space-y-1">
          <p className="font-semibold">{buyerInfo?.companyName || '-'}</p>
          {buyerInfo?.attn && <p>Attn: {buyerInfo.attn}</p>}
          {buyerInfo?.address && <p>{buyerInfo.address}</p>}
          {buyerInfo?.tel && <p>Tel: {buyerInfo.tel}</p>}
          {buyerInfo?.email && <p>Email: {buyerInfo.email}</p>}
        </div>
      </div>

      {/* Shipping Mark (CI & PL) */}
      {(isCI || isPL) && shippingMark && (
        <div className="mb-3 text-xs">
          <h4 className="font-bold text-[#1a3a5c] mb-1">SHIPPING MARK:</h4>
          <div className="border border-gray-300 px-3 py-2 whitespace-pre-wrap font-mono">{shippingMark}</div>
        </div>
      )}

      {/* Items Table */}
      <table className="w-full text-xs border-collapse mb-4" style={{ wordBreak: 'break-word' }}>
        <thead>
          <tr className="bg-[#1F4E78] text-white">
            {isPL ? (
              <>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '40px', minWidth: '40px' }}>No.</th>
                <th className="border border-gray-400 px-2 py-2 text-left" style={{ width: '250px', minWidth: '250px' }}>Description</th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '55px' }}>Qty<br/><span className="text-[10px] opacity-80">(CTN)</span></th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '70px' }}>CBM<br/><span className="text-[10px] opacity-80">(m³/CTN)</span></th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '60px' }}>N.W.<br/><span className="text-[10px] opacity-80">(kg)</span></th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '60px' }}>G.W.<br/><span className="text-[10px] opacity-80">(kg)</span></th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '70px' }}>Total CBM<br/><span className="text-[10px] opacity-80">(m³)</span></th>
              </>
            ) : (
              <>
                <th className="border border-gray-400 px-1 py-2 text-center" style={{ width: '100px', minWidth: '100px' }}>Image</th>
                <th className="border border-gray-400 px-2 py-2 text-left" style={{ width: '90px', minWidth: '90px' }}>Description</th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '110px' }}>Specs<br/><span className="text-[10px] opacity-80">(per CTN)</span></th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '45px' }}>Qty<br/><span className="text-[10px] opacity-80">(CTN)</span></th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '75px' }}>CBM<br/><span className="text-[10px] opacity-80">(m³/CTN)</span></th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '70px' }}>Total CBM<br/><span className="text-[10px] opacity-80">(m³)</span></th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '70px' }}>Price<br/><span className="text-[10px] opacity-80">(USD/CTN)</span></th>
                {showAmount && (
                  <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '85px' }}>Amount<br/><span className="text-[10px] opacity-80">(USD)</span></th>
                )}
                <th className="border border-gray-400 px-1 py-2 text-left" style={{ width: '50px', minWidth: '50px' }}>Remark</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={isPL ? 7 : (showAmount ? 9 : 8)} className="border border-gray-400 px-2 py-8 text-center text-gray-400">
                No items
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {isPL ? (
                  <>
                    <td className="border border-gray-400 px-2 py-1 text-center">{idx + 1}</td>
                    <td className="border border-gray-400 px-2 py-1">{item.description}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.cartons ?? item.quantity ?? '-'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.cbmPerUnit || '-'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.netWeight || '-'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.grossWeight || '-'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.cbm ?? '-'}</td>
                  </>
                ) : (
                  <>
                    <td className="border border-gray-400 px-1 py-2 text-center align-middle">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-20 h-20 object-cover mx-auto rounded" />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 mx-auto flex items-center justify-center text-gray-300 text-[10px] rounded">No img</div>
                      )}
                    </td>
                    <td className="border border-gray-400 px-2 py-1">{item.description}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.specs || '-'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.quantity || '-'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.cbmPerUnit || '-'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.totalCbm || '-'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center" style={{ whiteSpace: 'nowrap' }}>${item.unitPrice?.toFixed(2)}</td>
                    {showAmount && (
                      <td className="border border-gray-400 px-2 py-1 text-right font-semibold" style={{ whiteSpace: 'nowrap' }}>${((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}</td>
                    )}
                    <td className="border border-gray-400 px-1 py-1 text-xs">{item.remark || '-'}</td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
        {showAmount && items.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={9} className="px-2 py-1"></td>
            </tr>
          </tfoot>
        )}
        {isPL && items.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={3} className="px-2 py-2"></td>
              <td colSpan={4} className="px-0" style={{ verticalAlign: 'top' }}>
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    <tr>
                      <td className="px-2 py-1 text-right font-semibold text-gray-600" style={{ width: '60%' }}>Total Cartons:</td>
                      <td className="px-2 py-1 text-right">{totalCartons.toLocaleString()} CTNS</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-2 py-1 text-right font-semibold text-gray-600">Total Net Weight:</td>
                      <td className="px-2 py-1 text-right">{totalNW.toFixed(2)} KGS</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 text-right font-semibold text-gray-600">Total Gross Weight:</td>
                      <td className="px-2 py-1 text-right">{totalGW.toFixed(2)} KGS</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-2 py-1 text-right font-semibold text-gray-600">Total Volume:</td>
                      <td className="px-2 py-1 text-right">{totalCBM.toFixed(3)} CBM</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tfoot>
        )}
      </table>

      {/* Total Cartons + Grand Total (PI & CI) - standalone */}
      {showAmount && items.length > 0 && (
        <div className="mt-2 mb-4 ml-auto" style={{ width: '45%' }}>
          <div className="flex justify-between items-center py-1 text-xs">
            <span className="font-semibold text-gray-600">Total Cartons:</span>
            <span className="font-semibold">{totalQty.toLocaleString()} CTN</span>
          </div>
          <div className="flex justify-between items-center py-1 text-xs">
            <span className="font-semibold text-gray-600">Total Volume:</span>
            <span className="font-semibold">{totalVolume.toFixed(3)} CBM</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-t-2 border-[#1F4E78]">
            <span className="text-base font-bold text-[#1F4E78]">Grand Total:</span>
            <span className="text-lg font-bold text-[#1F4E78]" style={{ whiteSpace: 'nowrap' }}>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Amount in Words + Deposit/Balance (PI & CI) */}
      {showAmount && items.length > 0 && (
        <div className="mt-2 text-xs">
          <div className="px-3 py-2 mb-1.5 bg-[#f0f4f8] border border-[#1a3a5c]/20 rounded-sm">
            <span className="font-bold text-[#1a3a5c]">AMOUNT IN WORDS:</span>{' '}
            <span className="font-bold">{amountInWords}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="px-3 py-2 bg-[#f0f4f8] border border-[#1a3a5c]/20 rounded-sm">
              <span className="font-semibold text-[#1a3a5c]">Deposit (30%):</span>{' '}
              <span className="float-right font-bold" style={{ whiteSpace: 'nowrap' }}>${deposit.toFixed(2)}</span>
            </div>
            <div className="px-3 py-2 bg-[#f0f4f8] border border-[#1a3a5c]/20 rounded-sm">
              <span className="font-semibold text-[#1a3a5c]">Balance (70%):</span>{' '}
              <span className="float-right font-bold" style={{ whiteSpace: 'nowrap' }}>${balance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bank Info */}
      {data.bankInfo && (data.type === 'pi' || data.type === 'ci') && (
        <div className="mt-6 text-xs">
          <div className="border border-[#1a3a5c]/20 bg-[#f0f4f8] px-4 py-3 rounded-sm">
            <h4 className="font-bold text-[#1a3a5c] mb-2">BANK DETAILS (For T/T Payment)</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {data.bankInfo.accountName && (
                <div><span className="font-semibold">Beneficiary Name:</span> {data.bankInfo.accountName}</div>
              )}
              {data.bankInfo.bankName && (
                <div><span className="font-semibold">Beneficiary Bank:</span> {data.bankInfo.bankName}</div>
              )}
              {data.bankInfo.accountNumber && (
                <div><span className="font-semibold">Account No.:</span> {data.bankInfo.accountNumber}</div>
              )}
              {data.bankInfo.swiftCode && (
                <div><span className="font-semibold">SWIFT Code:</span> {data.bankInfo.swiftCode}</div>
              )}
              {data.bankInfo.iban && (
                <div><span className="font-semibold">IBAN:</span> {data.bankInfo.iban}</div>
              )}
              {data.bankInfo.routingNumber && (
                <div><span className="font-semibold">Routing No.:</span> {data.bankInfo.routingNumber}</div>
              )}
              {data.bankInfo.bankAddress && (
                <div className="col-span-2"><span className="font-semibold">Bank Address:</span> {data.bankInfo.bankAddress}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Terms */}
      {terms && (terms.priceTerm || terms.paymentTerm || terms.deliveryTime || terms.port) && (
        <div className="mt-6 text-xs">
          <h4 className="font-bold text-[#1a3a5c] mb-2">Terms & Conditions:</h4>
          <ul className="space-y-1 list-disc list-inside">
            {terms.priceTerm && <li>Price Term: {terms.priceTerm}</li>}
            {terms.paymentTerm && <li>Payment Term: {terms.paymentTerm}</li>}
            {terms.deliveryTime && <li>Delivery Time: {terms.deliveryTime}</li>}
            {terms.port && <li>Port: {terms.port}</li>}
            {terms.other && <li>{terms.other}</li>}
          </ul>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="mt-4 text-xs">
          <h4 className="font-bold text-[#1a3a5c] mb-1">Notes:</h4>
          <p className="text-gray-600">{data.notes}</p>
        </div>
      )}

      {/* Signature */}
      <div className="mt-10 flex justify-between text-xs">
        <div className="text-center">
          <div className="h-24 w-40"></div>
          <div className="border-t border-gray-400 w-40 pt-1">Buyer's Signature</div>
        </div>
        <div className="text-center w-40">
          <div className="h-24 w-40 relative">
            {sellerInfo?.signatureImage && (
              <img
                src={sellerInfo.signatureImage}
                alt="signature"
                className="absolute bottom-0 left-[-30px] h-16 w-36 object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
            )}
            {sellerInfo?.sealImage && (
              <img
                src={sellerInfo.sealImage}
                alt="seal"
                className="absolute -bottom-15 right-[-35px] h-40 w-40 object-contain opacity-80"
                style={{ mixBlendMode: 'multiply' }}
              />
            )}
          </div>
          <div className="border-t border-gray-400 w-40 pt-1">Seller's Signature</div>
        </div>
      </div>
    </div>
  );
}
