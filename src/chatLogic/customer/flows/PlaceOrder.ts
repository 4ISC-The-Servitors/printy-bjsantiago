import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { createOrder } from '../../../api/orderApi';
import type { OrderData } from '../../../api/orderApi';
import { getCurrentCustomerId } from '../../../lib/utils';

type Option = { label: string; next: string };
type Node = {
  id: string;
  message?: string;
  question?: string;
  answer?: string;
  options: Option[];
};

const NODES: Record<string, Node> = {
  // READ THIS FIRST

  // COMPLETED:
  // 1- Option branching mapped
  // 2- Categorized responses based on chat flow hierarchy

  // ISSUES:
  // 1- specification options are static 
  //      (all possible sizes and specs are visible, need conditions which options are only available)
  // 2- custom size and qty logic not yet implemented
  //      (one that requires user input)
  // 3- value storing logic not yet implemented 
  //      (stores all order specs of the user to a variable)
  // 4 - if user cant find or recognize categories of products they can type instead
  //      then mag fufunction siya as search. pwedeng ganon. tapos dapat may Back logic sa chat if ever gusto mag change ng category

  place_order_start: {
    id: 'place_order_start',
    message:
      "Hi! I'm Printy. I can help you with your printing needs. You can either place an order or track an existing one.",
    options: [
      { label: 'Place Order', next: 'place_order' },
      { label: 'Track Order', next: 'track_order' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  // TYPE OPTIONS
  place_order: {
    id: 'place_order',
    question: 'Place Order',
    answer:
      'We offer a variety of printing Services. What type are you interested in?',
    options: [
      { label: 'Commercial Printing', next: 'commercial_printing' },
      { label: 'Digital Printing', next: 'digital_printing' },
      { label: 'Packaging', next: 'packaging_option' },
      { label: 'Large Format Printing', next: 'large_format_printing' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  // CATEGORY OPTIONS
  commercial_printing: {
    id: 'commercial_printing',
    question: 'Commercial Printing',
    answer:
      'Excellent! Commercial printing is our go-to for high-volume, professional-grade projects. What can I help you with?',
    options: [
      { label: 'Marketing / Promotional Collaterals', next: 'marketing_promotional_collaterals' },
      { label: 'School Yearbooks', next: 'school_yearbooks' },
      { label: 'Books & Publication', next: 'books_publication' },
      { label: 'Commercial Forms', next: 'commercial_forms' },
      { label: 'Business Forms', next: 'business_forms' },
      { label: 'BIR Registered Forms', next: 'bir_registered_forms' },
      { label: 'Official Receipt', next: 'official_receipt' },
      { label: 'Sales Invoice', next: 'sales_invoice' },
      { label: 'Delivery Receipt', next: 'delivery_receipt' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  // MAIN PRODUCT OPTIONS
  marketing_promotional_collaterals: {
    id: 'marketing_promotional_collaterals',
    question: 'Marketing / Promotional Collaterals',
    answer:
      'Great! I can help you with your marketing and promotional needs. What kind of materials are you looking to create to help your business stand out?',
    options: [
      { label: 'Product Brochure / Catalogue', next: 'product_brochure_catalogue' },
      { label: 'Portfolio', next: 'portfolio_option' },
      { label: 'Invitation', next: 'invitation_option' },
      { label: 'Product Support Manual', next: 'product_support_manual' },
      { label: 'Poster, Flyer and Leaflet Conference Program and Registration Form', next: 'poster_flyer_leaflet' },
      { label: 'Wobbler', next: 'wobbler_option' },
      { label: 'Appointment Calendar', next: 'appointment_calendar' },
      { label: 'Desk Calendar', next: 'desk_calendar' },
      { label: 'Display Material', next: 'display_material' },
      { label: 'Advertising Material', next: 'advertising_material' },
      { label: 'Wall Calendar', next: 'wall_calendar' },
      { label: 'Direct Mail', next: 'direct_mail' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  school_yearbooks: {
    id: 'school_yearbooks',
    question: 'School Yearbooks',
    answer:
      "Excellent! We can definitely help you with school yearbooks. They're a perfect way to capture memories.",
    options: [
      { label: 'Design & Layout', next: 'design_layout' },
      { label: 'Proofing & Editing', next: 'proofing_editing' },
      { label: 'Project Management', next: 'project_management' },
      { label: 'Print & Delivery', next: 'print_delivery' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  books_publication: {
    id: 'books_publication',
    question: 'Books & Publication',
    answer:
      "Excellent choice! We specialize in professional book and publication printing. We can help you bring your story to life. What type of book or publication are you looking to create?",
    options: [
      { label: 'Magazine', next: 'magazine_option' },
      { label: 'Annual Report', next: 'annual_report' },
      { label: 'Coffee Table Book', next: 'coffee_table_book' },
      { label: 'Notebook', next: 'notebook_option' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  commercial_forms: {
    id: 'commercial_forms',
    question: 'Commercial Forms',
    answer:
      "Got it! We can help with your commercial forms to keep your business running smoothly. What kind of forms are you looking for?",
    options: [
      { label: 'Bank Form', next: 'bank_form' },
      { label: 'Insurance Form', next: 'insurance_form' },
      { label: 'Office Form', next: 'office_form' },
      { label: 'School Form', next: 'school_form' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  business_forms: {
    id: 'business_forms',
    question: 'Business Forms',
    answer:
      "Got it! We can help with your business forms to keep your company running smoothly. What kind of forms are you looking for?",
    options: [
      { label: 'Letterhead', next: 'letterhead_option' },
      { label: 'Memo Pad', next: 'memo_pad' },
      { label: 'Letter Envelope', next: 'letter_envelope' },
      { label: 'Company Folder', next: 'company_folder' },
      { label: 'Calling Card', next: 'calling_card' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  digital_printing: {
    id: 'digital_printing',
    question: 'Digital Printing',
    answer:
      "Great choice! Digital Printing is perfect for quick, high-quality projects. We can print a wide variety of items for you. What are you looking to create today?", 
    options: [
      { label: 'Menu Card / Placemat', next: 'menu_card_placemat' },
      { label: 'Calling Card', next: 'calling_card' },
      { label: 'Greeting Card', next: 'greeting_card' },
      { label: 'Invitation', next: 'invitation_option' },
      { label: 'Certificate', next: 'certificate_option' },
      { label: 'Diploma', next: 'diploma_option' },
      { label: 'Magazine', next: 'magazine_option' },
      { label: 'Memory Book', next: 'memory_book' },
      { label: 'Personalized Calendar', next: 'personalized_calendar' },
      { label: 'Mini-Poster', next: 'mini_poster' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  packaging_option: {
    id: 'packaging_option',
    question: 'Packaging',
    answer:
      "Awesome! I can help you with your custom packaging needs. We offer a variety of options to make your product stand out. What kind of packaging are you looking for?", 
    options: [
      { label: 'Soap Box', next: 'soap_box' },
      { label: 'Coffee / Tea Box', next: 'coffee_tea_box' },
      { label: 'Pharmaceutical Box', next: 'pharmaceutical_box' },
      { label: 'Labels & Sticker', next: 'labels_sticker' },
      { label: 'Product Box', next: 'product_box' },
      { label: 'Paper Bag', next: 'paper_bag' },
      { label: 'Hand Tag', next: 'hand_tag' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  large_format_printing: {
    id: 'large_format_printing',
    question: 'Large Format Printing',
    answer:
      "Great choice! Large format printing is perfect for making a big impression. We can help you create a variety of materials for your business.", 
    options: [
      { label: 'Tarpulin', next: 'tarpulin_option' },
      { label: 'Vinyl / Mesh Banner', next: 'vinyl_mesh_banner' },
      { label: 'Pole Banner', next: 'pole_banner' },
      { label: 'Retractable Banner', next: 'retractable_banner' },
      { label: 'Reflectorized Signage', next: 'reflectorized_signage' },
      { label: 'Safety Sign / Parking Sign', next: 'safety_sign_parking_sign' },
      { label: 'A-Frame Sign', next: 'a_frame_sign' },
      { label: 'Poster / Wall Mural', next: 'poster_wall_mural' },
      { label: 'Window Decal / Wall Decal', next: 'window_decal_wall_decal' },
      { label: 'Bumper Sticker', next: 'bumper_sticker' },
      { label: 'Floor Graphic', next: 'floor_graphic' },
      { label: 'Counter Card', next: 'counter_card' },
      { label: 'Life-sized Standee', next: 'life_sized_standee' },
      { label: 'Wrap-around Vehicle Sticker', next: 'wrap_around_vehicle_sticker' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  // PRODUCT DESCRIPTION (64 products)
  bir_registered_forms: {
    id: 'bir_registered_forms',
    question: 'BIR Registered Forms',
    answer:
      "text description here", 
    options: [
      { label: 'Black and White', next: 'black_and_white' },
      { label: 'Matte', next: 'matte_option' },
      { label: 'Glossy', next: 'glossy_option' },
      { label: 'Spiral Bound', next: 'spiral_bound' },
      { label: 'Coil Bound', next: 'coil_bound' },
      { label: 'Hard Bound', next: 'hard_bound' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  // SPECIFICATION OPTIONS
  black_and_white: {
    id: 'black_and_white',
    question: 'Black and White',
    answer:
      "Great! Now, let's talk about the size. You can choose from one of our popular options or set your own custom dimensions.", 
    options: [
      { label: '5.5" x 8.5" (Standard Paperback)', next: 'standard_paperback' },
      { label: '6" x 9" (Common Book Size)', next: 'common_book_size' },
      { label: '8.5" x 11" (Standard Letter)', next: 'standard_letter' },
      { label: '2 ft x 3 ft (Small Banner)', next: 'small_banner' },
      { label: '3 ft x 4 ft (Standard Size)', next: 'standard_size' },
      { label: '4 ft x 6 ft (Large Banner)', next: 'large_banner' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  matte_option: {
    id: 'matte_option',
    question: 'Matte',
    answer:
      "Great! Now, let's talk about the size. You can choose from one of our popular options or set your own custom dimensions.", 
    options: [
      { label: '5.5" x 8.5" (Standard Paperback)', next: 'standard_paperback' },
      { label: '6" x 9" (Common Book Size)', next: 'common_book_size' },
      { label: '8.5" x 11" (Standard Letter)', next: 'standard_letter' },
      { label: '2 ft x 3 ft (Small Banner)', next: 'small_banner' },
      { label: '3 ft x 4 ft (Standard Size)', next: 'standard_size' },
      { label: '4 ft x 6 ft (Large Banner)', next: 'large_banner' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  glossy_option: {
    id: 'glossy_option',
    question: 'Glossy',
    answer:
      "Great! Now, let's talk about the size. You can choose from one of our popular options or set your own custom dimensions.", 
    options: [
      { label: '5.5" x 8.5" (Standard Paperback)', next: 'standard_paperback' },
      { label: '6" x 9" (Common Book Size)', next: 'common_book_size' },
      { label: '8.5" x 11" (Standard Letter)', next: 'standard_letter' },
      { label: '2 ft x 3 ft (Small Banner)', next: 'small_banner' },
      { label: '3 ft x 4 ft (Standard Size)', next: 'standard_size' },
      { label: '4 ft x 6 ft (Large Banner)', next: 'large_banner' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  spiral_bound: {
    id: 'spiral_bound',
    question: 'Spiral Bound',
    answer:
      "Great! Now, let's talk about the size. You can choose from one of our popular options or set your own custom dimensions.", 
    options: [
      { label: '5.5" x 8.5" (Standard Paperback)', next: 'standard_paperback' },
      { label: '6" x 9" (Common Book Size)', next: 'common_book_size' },
      { label: '8.5" x 11" (Standard Letter)', next: 'standard_letter' },
      { label: '2 ft x 3 ft (Small Banner)', next: 'small_banner' },
      { label: '3 ft x 4 ft (Standard Size)', next: 'standard_size' },
      { label: '4 ft x 6 ft (Large Banner)', next: 'large_banner' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  coil_bound: {
    id: 'coil_bound',
    question: 'Coil Bound',
    answer:
      "Great! Now, let's talk about the size. You can choose from one of our popular options or set your own custom dimensions.", 
    options: [
      { label: '5.5" x 8.5" (Standard Paperback)', next: 'standard_paperback' },
      { label: '6" x 9" (Common Book Size)', next: 'common_book_size' },
      { label: '8.5" x 11" (Standard Letter)', next: 'standard_letter' },
      { label: '2 ft x 3 ft (Small Banner)', next: 'small_banner' },
      { label: '3 ft x 4 ft (Standard Size)', next: 'standard_size' },
      { label: '4 ft x 6 ft (Large Banner)', next: 'large_banner' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  hard_bound: {
    id: 'hard_bound',
    question: 'Hard Bound',
    answer:
      "Great! Now, let's talk about the size. You can choose from one of our popular options or set your own custom dimensions.", 
    options: [
      { label: '5.5" x 8.5" (Standard Paperback)', next: 'standard_paperback' },
      { label: '6" x 9" (Common Book Size)', next: 'common_book_size' },
      { label: '8.5" x 11" (Standard Letter)', next: 'standard_letter' },
      { label: '2 ft x 3 ft (Small Banner)', next: 'small_banner' },
      { label: '3 ft x 4 ft (Standard Size)', next: 'standard_size' },
      { label: '4 ft x 6 ft (Large Banner)', next: 'large_banner' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  // SIZE OPTIONS
  standard_paperback: {
    id: 'standard_paperback',
    question: '5.5" x 8.5" (Standard Paperback)',
    answer:
      "Okay, let's nail down the page count. How many pages will your project have?", 
    options: [
      { label: '1000 Pages', next: 'one_thousand_pages' },
      { label: '500 Pages', next: 'five_hundred_pages' },
      { label: '250 Pages', next: 'two_hundred_fifty_pages' },
      { label: '100 Pages', next: 'one_hundred_pages' },
      { label: '50 Pages', next: 'fifty_pages' },
      { label: '20 Pages', next: 'twenty_pages' },
      { label: '10 Pages', next: 'ten_pages' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  common_book_size: {
    id: 'common_book_size',
    question: '6" x 9" (Common Book Size)',
    answer:
      "Okay, let's nail down the page count. How many pages will your project have?", 
    options: [
      { label: '1000 Pages', next: 'one_thousand_pages' },
      { label: '500 Pages', next: 'five_hundred_pages' },
      { label: '250 Pages', next: 'two_hundred_fifty_pages' },
      { label: '100 Pages', next: 'one_hundred_pages' },
      { label: '50 Pages', next: 'fifty_pages' },
      { label: '20 Pages', next: 'twenty_pages' },
      { label: '10 Pages', next: 'ten_pages' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  standard_letter: {
    id: 'standard_letter',
    question: '8.5" x 11" (Standard Letter)',
    answer:
      "Okay, let's nail down the page count. How many pages will your project have?", 
    options: [
      { label: '1000 Pages', next: 'one_thousand_pages' },
      { label: '500 Pages', next: 'five_hundred_pages' },
      { label: '250 Pages', next: 'two_hundred_fifty_pages' },
      { label: '100 Pages', next: 'one_hundred_pages' },
      { label: '50 Pages', next: 'fifty_pages' },
      { label: '20 Pages', next: 'twenty_pages' },
      { label: '10 Pages', next: 'ten_pages' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  small_banner: {
    id: 'small_banner',
    question: '2 ft x 3 ft (Small Banner)',
    answer:
      "Okay, let's nail down the page count. How many pages will your project have?", 
    options: [
      { label: '1000 Pages', next: 'one_thousand_pages' },
      { label: '500 Pages', next: 'five_hundred_pages' },
      { label: '250 Pages', next: 'two_hundred_fifty_pages' },
      { label: '100 Pages', next: 'one_hundred_pages' },
      { label: '50 Pages', next: 'fifty_pages' },
      { label: '20 Pages', next: 'twenty_pages' },
      { label: '10 Pages', next: 'ten_pages' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  standard_size: {
    id: 'standard_size',
    question: '3 ft x 4 ft (Standard Size)',
    answer:
      "Okay, let's nail down the page count. How many pages will your project have?", 
    options: [
      { label: '1000 Pages', next: 'one_thousand_pages' },
      { label: '500 Pages', next: 'five_hundred_pages' },
      { label: '250 Pages', next: 'two_hundred_fifty_pages' },
      { label: '100 Pages', next: 'one_hundred_pages' },
      { label: '50 Pages', next: 'fifty_pages' },
      { label: '20 Pages', next: 'twenty_pages' },
      { label: '10 Pages', next: 'ten_pages' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  large_banner: {
    id: 'large_banner',
    question: '4 ft x 6 ft (Large Banner)',
    answer:
      "Okay, let's nail down the page count. How many pages will your project have?", 
    options: [
      { label: '1000 Pages', next: 'one_thousand_pages' },
      { label: '500 Pages', next: 'five_hundred_pages' },
      { label: '250 Pages', next: 'two_hundred_fifty_pages' },
      { label: '100 Pages', next: 'one_hundred_pages' },
      { label: '50 Pages', next: 'fifty_pages' },
      { label: '20 Pages', next: 'twenty_pages' },
      { label: '10 Pages', next: 'ten_pages' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  // QUANTITY OPTIONS
  one_thousand_pages: {
    id: 'one_thousand_pages',
    question: '1000 Pages',
    answer:
      "Alright, let's get this finalized! Here is a summary of your order details.", 
    options: [
      { label: 'Create Quotation', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  five_hundred_pages: {
    id: 'five_hundred_pages',
    question: '500 Pages',
    answer:
      "Alright, let's get this finalized! Here is a summary of your order details.", 
    options: [
      { label: 'Create Quotation', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  two_hundred_fifty_pages: {
    id: 'two_hundred_fifty_pages',
    question: '250 Pages',
    answer:
      "Alright, let's get this finalized! Here is a summary of your order details.", 
    options: [
      { label: 'Create Quotation', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  one_hundred_pages: {
    id: 'one_hundred_pages',
    question: '100 Pages',
    answer:
      "Alright, let's get this finalized! Here is a summary of your order details.", 
    options: [
      { label: 'Create Quotation', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  fifty_pages: {
    id: 'fifty_pages',
    question: '50 Pages',
    answer:
      "Alright, let's get this finalized! Here is a summary of your order details.", 
    options: [
      { label: 'Create Quotation', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  twenty_pages: {
    id: 'twenty_pages',
    question: '20 Pages',
    answer:
      "Alright, let's get this finalized! Here is a summary of your order details.", 
    options: [
      { label: 'Create Quotation', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  ten_pages: {
    id: 'ten_pages',
    question: '10 Pages',
    answer:
      "Alright, let's get this finalized! Here is a summary of your order details.", 
    options: [
      { label: 'Create Quotation', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  // CREATE QUOTATION
  create_quote: {
    id: 'create_quote',
    question: 'Create Quote',
    answer:
      "Perfect! I've started creating a quote for you. Our team will review your requirements and send you a detailed quote within 2 hours.",
    options: [{ label: 'End Chat', next: 'end' }],
  },

  submit_inquiry: {
    id: 'submit_inquiry',
    question: 'Submit Inquiry',
    answer:
      "Thank you for your inquiry! I've submitted it to our team. We'll review your requirements and get back to you within 24 hours.",
    options: [{ label: 'End Chat', next: 'end' }],
  },

  end: {
    id: 'end',
    answer: 'Thank you for chatting with Printy! Have a great day. 👋',
    options: [],
  },
};

let currentNodeId: keyof typeof NODES = 'place_order_start';

// Store order details progressively
let orderRecord: Partial<OrderData> = {};

function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'printy', text: node.message }];
  if (node.answer) return [{ role: 'printy', text: node.answer }];
  return [];
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map(o => o.label);
}

export const placeOrderFlow: ChatFlow = {
  id: 'place-order',
  title: 'Place an Order',
  initial: () => {
    currentNodeId = 'place_order_start';
    orderRecord = {};
    return nodeToMessages(NODES[currentNodeId]);
  },
  quickReplies: () => nodeQuickReplies(NODES[currentNodeId]),
  respond: async (ctx, input) => {
    const current = NODES[currentNodeId];
    const selection = current.options.find(
      o => o.label.toLowerCase() === input.trim().toLowerCase()
    );
    if (!selection) {
      return {
        messages: [
          { role: 'printy', text: 'Please choose one of the options.' },
        ],
        quickReplies: nodeQuickReplies(current),
      };
    }
    currentNodeId = selection.next as keyof typeof NODES;
    const node = NODES[currentNodeId];
    const messages = nodeToMessages(node);
    const quickReplies = nodeQuickReplies(node);

    // Store user selections in orderRecord at key steps
    // Example: page size and quantity nodes
    if (
      [
        'standard_paperback',
        'common_book_size',
        'standard_letter',
        'small_banner',
        'standard_size',
        'large_banner',
      ].includes(currentNodeId)
    ) {
      orderRecord.page_size = Number(
        currentNodeId === 'standard_paperback'
          ? 1
          : currentNodeId === 'common_book_size'
          ? 2
          : currentNodeId === 'standard_letter'
          ? 3
          : currentNodeId === 'small_banner'
          ? 4
          : currentNodeId === 'standard_size'
          ? 5
          : currentNodeId === 'large_banner'
          ? 6
          : 1
      );
    }
    if (
      [
        'one_thousand_pages',
        'five_hundred_pages',
        'two_hundred_fifty_pages',
        'one_hundred_pages',
        'fifty_pages',
        'twenty_pages',
        'ten_pages',
      ].includes(currentNodeId)
    ) {
      orderRecord.quantity = Number(
        currentNodeId === 'one_thousand_pages'
          ? 1000
          : currentNodeId === 'five_hundred_pages'
          ? 500
          : currentNodeId === 'two_hundred_fifty_pages'
          ? 250
          : currentNodeId === 'one_hundred_pages'
          ? 100
          : currentNodeId === 'fifty_pages'
          ? 50
          : currentNodeId === 'twenty_pages'
          ? 20
          : currentNodeId === 'ten_pages'
          ? 10
          : 1
      );
    }

    // When ready to create the order
    if (currentNodeId === 'create_quote') {
      // Use customer_id from session/localStorage
      const sessionCustomerId =
        typeof ctx.customerId === 'string' && ctx.customerId.length === 36
          ? ctx.customerId
          : getCurrentCustomerId();

      const order: OrderData = {
        order_id: crypto.randomUUID(),
        service_id: typeof ctx.serviceId === 'string' ? ctx.serviceId : '1001',
        customer_id: sessionCustomerId,
        order_status: 'pending',
        delivery_mode: typeof ctx.deliveryMode === 'string' ? ctx.deliveryMode : 'pickup',
        order_date_time: new Date().toISOString(),
        completed_date_time: null,
        page_size: typeof orderRecord.page_size === 'number' ? orderRecord.page_size : 1,
        quantity: typeof orderRecord.quantity === 'number' ? orderRecord.quantity : 100,
        priority_level: typeof ctx.priorityLevel === 'number' ? ctx.priorityLevel : 1,
      };

      console.log('Using customer_id:', sessionCustomerId); // <-- Add here

      await createOrder(order);
      orderRecord = {};
    }

    // If user chose End Chat option, still provide the closing message and a single End Chat button
    if (currentNodeId === 'end') {
      return { messages, quickReplies: ['End Chat'] };
    }
    return { messages, quickReplies };
  },
};
