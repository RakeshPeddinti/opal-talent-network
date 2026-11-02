import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, User, Mail, Tag, X, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

interface BookingRecord {
  id: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  status: string;
  paymentStatus: string;
  price: number;
  createdAt: any;
}

interface CalendarViewProps {
  bookings: BookingRecord[];
  onUpdateStatus: (ids: string | string[], status: string) => void;
  onLogout: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ bookings, onUpdateStatus, onLogout }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getBookingsForDay = (day: Date) => {
    const dayBookings = bookings.filter(booking => {
      try {
        const bookingDate = parseISO(booking.date);
        return isSameDay(bookingDate, day);
      } catch (e) {
        return false;
      }
    });

    // Group by time and customer
    const grouped: Record<string, any> = {};
    dayBookings.forEach(b => {
      const key = `${b.customerEmail || b.customerName}-${b.time}`;
      if (!grouped[key]) {
        grouped[key] = {
          ...b,
          serviceNames: [b.serviceName],
          totalPrice: b.price,
          bookingIds: [b.id]
        };
      } else {
        grouped[key].serviceNames.push(b.serviceName);
        grouped[key].totalPrice += b.price;
        grouped[key].bookingIds.push(b.id);
        if (b.status === 'pending') grouped[key].status = 'pending';
      }
    });

    return Object.values(grouped).sort((a, b) => a.time.localeCompare(b.time));
  };

  const handleUpdateStatus = async (ids: string | string[], status: string) => {
    await onUpdateStatus(ids, status);
    setSelectedBooking(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-brand-gold/10 overflow-hidden shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-8 border-bottom border-brand-gold/5">
        <h3 className="text-3xl font-serif">{format(currentDate, 'MMMM yyyy')}</h3>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-brand-cream rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-brand-cream rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-t border-brand-gold/5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-4 text-center text-xs uppercase tracking-widest font-bold text-brand-muted border-b border-brand-gold/5 bg-brand-cream/30">
            {day}
          </div>
        ))}
        {calendarDays.map((day, i) => {
          const dayBookings = getBookingsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const hasBookings = dayBookings.length > 0;
          
          return (
            <div 
              key={day.toString()} 
              onClick={() => hasBookings && setSelectedDay(day)}
              className={cn(
                "min-h-[140px] p-2 border-r border-b border-brand-gold/5 transition-all cursor-pointer relative",
                !isCurrentMonth && "bg-brand-cream/10 opacity-40",
                isCurrentMonth && "hover:bg-brand-cream/20",
                hasBookings && isCurrentMonth && "bg-brand-gold/[0.03] border-brand-gold/20"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                {hasBookings && (
                  <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                )}
                <div className="ml-auto">
                  <span className={cn(
                    "text-sm font-medium p-1",
                    isSameDay(day, new Date()) && "bg-brand-gold text-white rounded-full w-7 h-7 inline-flex items-center justify-center"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                {dayBookings.slice(0, 3).map(booking => (
                  <div
                    key={booking.id}
                    className="w-full text-left px-2 py-1 bg-brand-gold/10 rounded text-[10px] truncate flex items-center gap-1"
                  >
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      booking.status === 'pending' ? "bg-brand-gold" : "bg-green-500"
                    )} />
                    <span className="font-bold">{booking.time}</span>
                    <span>{booking.customerName}</span>
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-[10px] text-brand-muted text-center font-bold mt-1">
                    + {dayBookings.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Bookings Modal */}
      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-brand-gold/20 relative"
            >
              <button 
                onClick={() => setSelectedDay(null)}
                className="absolute top-6 right-6 p-2 hover:bg-brand-cream rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8">
                <h3 className="text-4xl font-serif mb-2">{format(selectedDay, 'MMMM do, yyyy')}</h3>
                <p className="text-brand-muted">Appointments for this day</p>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {getBookingsForDay(selectedDay).map((booking) => (
                  <div 
                    key={booking.id}
                    className="p-4 bg-brand-cream/30 rounded-2xl border border-brand-gold/10 flex items-center justify-between group hover:border-brand-gold/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-brand-gold" />
                      </div>
                      <div>
                        <p className="font-bold text-brand-dark">{booking.time}</p>
                        <p className="text-xs text-brand-muted">{booking.customerName} • {booking.serviceNames.join(', ')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setSelectedDay(null);
                      }}
                      className="px-4 py-2 bg-white border border-brand-gold/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gold hover:text-white transition-all"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-brand-gold/10">
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="w-full py-4 bg-brand-dark text-white rounded-xl font-medium hover:bg-brand-gold transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-brand-gold/20 relative"
            >
              <button 
                onClick={() => setSelectedBooking(null)}
                className="absolute top-6 right-6 p-2 hover:bg-brand-cream rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8">
                <span className={cn(
                  "px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block",
                  selectedBooking.status === 'pending' ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                )}>
                  {selectedBooking.status}
                </span>
                <h3 className="text-4xl font-serif mb-2">Appointment Details</h3>
                <p className="text-brand-muted">Booking ID: #{selectedBooking.id}</p>
              </div>

              <div className="grid gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-brand-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-brand-muted uppercase tracking-wider font-bold mb-1">Client</p>
                    <p className="text-xl font-medium">{selectedBooking.customerName}</p>
                    <p className="text-brand-muted flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" /> {selectedBooking.customerEmail}
                    </p>
                    <p className="text-brand-muted flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4" /> {selectedBooking.customerPhone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                    <Tag className="w-6 h-6 text-brand-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-brand-muted uppercase tracking-wider font-bold mb-1">Services</p>
                    <p className="text-xl font-medium">{selectedBooking.serviceNames?.join(', ') || selectedBooking.serviceName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-widest rounded">
                        {selectedBooking.bookingIds?.length || 1} {selectedBooking.bookingIds?.length === 1 ? 'Service' : 'Services'}
                      </span>
                      <p className="text-brand-muted font-serif">${selectedBooking.totalPrice || selectedBooking.price}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-brand-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted uppercase tracking-wider font-bold mb-1">Time</p>
                      <p className="text-xl font-medium">{selectedBooking.time}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                      <ChevronRight className="w-6 h-6 text-brand-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted uppercase tracking-wider font-bold mb-1">Date</p>
                      <p className="text-xl font-medium">{selectedBooking.date}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-brand-gold/10 flex flex-col gap-4">
                {selectedBooking.status === 'pending' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedBooking.bookingIds || selectedBooking.id, 'done')}
                    className="w-full py-4 bg-brand-gold text-white rounded-xl font-medium hover:bg-brand-dark transition-all shadow-lg"
                  >
                    Mark as Completed
                  </button>
                )}
                {selectedBooking.status === 'pending' && selectedBooking.paymentStatus === 'unpaid' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedBooking.bookingIds || selectedBooking.id, 'cancelled')}
                    className="w-full py-4 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-600 hover:text-white transition-all"
                  >
                    Cancel Appointment
                  </button>
                )}
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="w-full py-4 bg-brand-dark text-white rounded-xl font-medium hover:bg-brand-gold transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
