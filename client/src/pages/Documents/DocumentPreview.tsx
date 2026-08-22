import { DOCUMENT_TYPE_TITLES, type DocumentData } from '@/api/documents';

interface DocumentPreviewProps {
  data: DocumentData;
}

export default function DocumentPreview({ data }: DocumentPreviewProps) {
  const { type, sellerInfo, buyerInfo, items = [], terms, currency = 'USD' } = data;
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

  const isPL = type === 'pl';
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

      {/* Items Table */}
      <table className="w-full text-xs border-collapse mb-4" style={{ wordBreak: 'break-word' }}>
        <thead>
          <tr className="bg-[#1F4E78] text-white">
            {!isPL && <th className="border border-gray-400 px-1 py-2 text-center" style={{ width: '100px', minWidth: '100px' }}>Image</th>}
            <th className="border border-gray-400 px-2 py-2 text-left" style={{ width: '90px', minWidth: '90px' }}>Description</th>
            {!isPL && <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '80px' }}>Specs<br/><span className="text-[10px] opacity-80">(per CTN)</span></th>}
            <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '45px' }}>Qty<br/><span className="text-[10px] opacity-80">(CTN)</span></th>
            {!isPL && (
              <>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '75px' }}>CBM<br/><span className="text-[10px] opacity-80">(m³/CTN)</span></th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '70px' }}>Total CBM<br/><span className="text-[10px] opacity-80">(m³)</span></th>
              </>
            )}
            {isPL ? (
              <>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '50px' }}>CTNs</th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '90px' }}>CTN Size</th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '60px' }}>G.W<br/><span className="text-[10px] opacity-80">(kg)</span></th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '60px' }}>N.W<br/><span className="text-[10px] opacity-80">(kg)</span></th>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '60px' }}>CBM</th>
              </>
            ) : (
              <>
                <th className="border border-gray-400 px-2 py-2 text-center" style={{ width: '85px' }}>price<br/><span className="text-[10px] opacity-80">(USD/CTN)</span></th>
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
                {!isPL && (
                  <td className="border border-gray-400 px-1 py-2 text-center align-middle">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-20 h-20 object-cover mx-auto rounded" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 mx-auto flex items-center justify-center text-gray-300 text-[10px] rounded">No img</div>
                    )}
                  </td>
                )}
                <td className="border border-gray-400 px-2 py-1">{item.description}</td>
                {!isPL && <td className="border border-gray-400 px-2 py-1 text-center">{item.specs || '-'}</td>}
                <td className="border border-gray-400 px-2 py-1 text-center">{item.quantity}</td>
                {!isPL && (
                  <>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.cbmPerUnit || '-'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.totalCbm || '-'}</td>
                  </>
                )}
                {isPL ? (
                  <>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.cartons || '-'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.ctnSize || '-'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.grossWeight || '-'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.netWeight || '-'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.cbm || '-'}</td>
                  </>
                ) : (
                  <>
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
              <td colSpan={8} className="border-t-2 border-[#1F4E78] px-2 py-3 text-right text-base font-bold text-[#1F4E78]">Grand Total:</td>
              <td className="border-t-2 border-[#1F4E78] px-2 py-3 text-right text-lg font-bold text-[#1F4E78]" style={{ whiteSpace: 'nowrap' }}>${totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        )}
        {isPL && items.length > 0 && (
          <tfoot>
            <tr className="bg-gray-50 font-semibold">
              <td className="border border-gray-400 px-2 py-2 text-right" colSpan={2}>TOTAL:</td>
              <td className="border border-gray-400 px-2 py-2 text-center">{totalCartons}</td>
              <td className="border border-gray-400 px-2 py-2"></td>
              <td className="border border-gray-400 px-2 py-2 text-center">{totalGW.toFixed(2)}</td>
              <td className="border border-gray-400 px-2 py-2 text-center">{totalNW.toFixed(2)}</td>
              <td className="border border-gray-400 px-2 py-2 text-center">{totalCBM.toFixed(3)}</td>
            </tr>
          </tfoot>
        )}
      </table>

      {/* Bank Info */}
      {data.bankInfo && (data.type === 'pi' || data.type === 'ci') && (
        <div className="mt-6 text-xs border-t border-gray-300 pt-4">
          <h4 className="font-bold text-[#1a3a5c] mb-2">BANK INFORMATION</h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {data.bankInfo.bankName && (
              <div><span className="font-semibold">Bank Name:</span> {data.bankInfo.bankName}</div>
            )}
            {data.bankInfo.accountName && (
              <div><span className="font-semibold">Account Name:</span> {data.bankInfo.accountName}</div>
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
            {sellerInfo?.sealImage && (
              <img
                src={sellerInfo.sealImage}
                alt="seal"
                className="absolute -bottom-15 right-0 h-40 w-40 object-contain opacity-80"
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
