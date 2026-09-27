<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClinicAccountMail extends Notification
{
    public function __construct(
        public string $heading,
        public string $intro,
        public string $action,
        public string $url,
        public int $minutes = 30,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->heading.' — Super Health Center')
            ->view(['emails.account', 'emails.account-text'], [
                'heading' => $this->heading,
                'intro' => $this->intro,
                'action' => $this->action,
                'url' => $this->url,
                'minutes' => $this->minutes,
            ]);
    }
}
