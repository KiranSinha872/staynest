import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/client.js';
import { STAY_TYPES } from '../../utils/format.js';

const TITLE_MIN = 10;
const TITLE_MAX = 100;
const DESCRIPTION_MIN = 30;

function validate(values) {
  const errors = {};

  const title = (values.title || '').trim();
  if (!title || title.length < TITLE_MIN) {
    errors.title = `Title must be at least ${TITLE_MIN} characters`;
  } else if (title.length > TITLE_MAX) {
    errors.title = `Title must be at most ${TITLE_MAX} characters`;
  }

  const description = (values.description || '').trim();
  if (!description || description.length < DESCRIPTION_MIN) {
    errors.description = `Description must be at least ${DESCRIPTION_MIN} characters`;
  }

  const priceRaw = String(values.pricePerNight ?? '').trim();
  const price = Number(priceRaw);
  if (!priceRaw || !Number.isFinite(price) || price <= 0) {
    errors.pricePerNight = 'Price must be greater than 0';
  }

  const imageUrl = (values.imageUrl || '').trim();
  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.imageUrl = 'Image URL must use http or https';
      }
    } catch {
      errors.imageUrl = 'Image URL must be a valid URL';
    }
  }

  return errors;
}

const empty = {
  title: '',
  description: '',
  type: 'homestay',
  city: '',
  state: '',
  address: '',
  pricePerNight: '',
  maxGuests: 2,
  bedrooms: 1,
  amenities: '',
  imageUrl: '',
};

export default function ListingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/listings/${id}`).then(({ data }) =>
      setForm({
        ...empty,
        ...data,
        amenities: data.amenities.join(', '),
        imageUrl: data.images[0] || '',
      })
    );
  }, [id, isEdit]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const touch = (key) => () => setTouched((prev) => ({ ...prev, [key]: true }));
  const show = (key) => Boolean((touched[key] || submitted) && errors[key]);

  // TODO: replace the image URL field with real image upload (Cloudinary / multer).
  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;
    setError('');
    const { title, description, type, city, state, address, imageUrl, amenities } = form;
    const payload = {
      title,
      description,
      type,
      city,
      state,
      address,
      pricePerNight: Number(form.pricePerNight),
      maxGuests: Number(form.maxGuests),
      bedrooms: Number(form.bedrooms),
      amenities: amenities.split(',').map((a) => a.trim()).filter(Boolean),
    };
    if (imageUrl) payload.images = [imageUrl];
    try {
      if (isEdit) await api.put(`/listings/${id}`, payload);
      else await api.post('/listings', payload);
      navigate('/host');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form className="card form wide" onSubmit={submit}>
      <h1>{isEdit ? 'Edit listing' : 'Create a new listing'}</h1>
      <input
        required
        placeholder="Title"
        value={form.title}
        onChange={set('title')}
        onBlur={touch('title')}
        aria-invalid={show('title')}
        aria-describedby={show('title') ? 'title-error' : undefined}
      />
      {show('title') && <span id="title-error" className="error small">{errors.title}</span>}
      <textarea
        required
        placeholder="Describe your place"
        value={form.description}
        onChange={set('description')}
        onBlur={touch('description')}
        aria-invalid={show('description')}
        aria-describedby={show('description') ? 'description-error' : undefined}
      />
      {show('description') && <span id="description-error" className="error small">{errors.description}</span>}
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <select className="grow" value={form.type} onChange={set('type')}>
          {STAY_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <div className="grow">
          <input
            required
            type="number"
            min="0"
            placeholder="Price per night (₹)"
            value={form.pricePerNight}
            onChange={set('pricePerNight')}
            onBlur={touch('pricePerNight')}
            aria-invalid={show('pricePerNight')}
            aria-describedby={show('pricePerNight') ? 'price-error' : undefined}
          />
          {show('pricePerNight') && (
            <span id="price-error" className="error small" style={{ display: 'block', marginTop: 4 }}>
              {errors.pricePerNight}
            </span>
          )}
        </div>
      </div>
      <div className="row">
        <input required placeholder="City" value={form.city} onChange={set('city')} />
        <input required placeholder="State" value={form.state} onChange={set('state')} />
      </div>
      <input required placeholder="Address" value={form.address} onChange={set('address')} />
      <div className="row">
        <label className="grow">Max guests
          <input type="number" min="1" value={form.maxGuests} onChange={set('maxGuests')} />
        </label>
        <label className="grow">Bedrooms
          <input type="number" min="0" value={form.bedrooms} onChange={set('bedrooms')} />
        </label>
      </div>
      <input placeholder="Amenities (comma separated: WiFi, AC, Parking)" value={form.amenities} onChange={set('amenities')} />
      <input
        placeholder="Image URL (optional)"
        value={form.imageUrl}
        onChange={set('imageUrl')}
        onBlur={touch('imageUrl')}
        aria-invalid={show('imageUrl')}
        aria-describedby={show('imageUrl') ? 'image-error' : undefined}
      />
      {show('imageUrl') && <span id="image-error" className="error small">{errors.imageUrl}</span>}
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={hasErrors}>{isEdit ? 'Save changes' : 'Publish listing'}</button>
    </form>
  );
}

