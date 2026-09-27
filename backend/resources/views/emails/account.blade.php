<!doctype html>
<html lang="en" dir="ltr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{{ $heading }}</title></head>
<body style="margin:0;background:#f1f5f9;color:#172c3c;font-family:Arial,sans-serif;">
<div lang="en" dir="ltr" style="padding:24px 12px;">
    <div style="display:none;max-height:0;overflow:hidden;">{{ $heading }}.@if ($minutes > 0) This secure link expires in {{ $minutes }} minutes.@endif</div>
    <table role="presentation" style="width:100%;max-width:560px;margin:auto;border-collapse:collapse;background:#ffffff;">
        <tr><td style="padding:28px;background:#075985;color:#ffffff;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;">SMARTSERVE • PATIENT &amp; CLINIC ACCESS</p>
            <p style="margin:0;font-size:24px;font-weight:bold;">Super Health Center</p>
            <p style="margin:8px 0 0;font-size:16px;">Jones, Isabela</p>
        </td></tr>
        <tr><td style="padding:28px;">
            <h1 style="font-size:24px;margin:0 0 20px;">{{ $heading }}</h1>
            <p style="font-size:16px;line-height:1.65;">{{ $intro }}</p>
            <p style="margin:28px 0;"><a href="{{ $url }}" style="display:inline-block;padding:16px 24px;background:#075985;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;border-radius:8px;">{{ $action }}</a></p>
            <p style="font-size:16px;line-height:1.65;">@if ($minutes > 0)This link expires in {{ $minutes }} minutes. Keep it private. @endif We will never ask you to send your password by email.</p>
            <p style="font-size:14px;line-height:1.6;color:#334155;">If you did not request this, you can ignore this message. If the button does not work, copy this address into your browser:</p>
            <p style="font-size:13px;overflow-wrap:anywhere;word-break:break-all;color:#334155;">{{ $url }}</p>
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid #e2e8f0;font-size:14px;color:#334155;">Super Health Center • Jones, Isabela<br>Secure access to your clinic account</td></tr>
    </table>
</div>
</body></html>
